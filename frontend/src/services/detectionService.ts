import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { DetectionEvent } from '../types';

export class FaceDetectionService {
  private lastFaceTime: number = Date.now();
  private lastFocusTime: number = Date.now();
  private noFaceStartTime: number | null = null;
  private focusLostStartTime: number | null = null;

  async detectFaces(videoElement: HTMLVideoElement): Promise<DetectionEvent[]> {
    const events: DetectionEvent[] = [];
    const currentTime = Date.now();

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const faces = await this.simpleFaceDetection(imageData);

      if (faces.length === 0) {
        if (this.noFaceStartTime === null) {
          this.noFaceStartTime = currentTime;
        } else if (currentTime - this.noFaceStartTime > 10000) {
          events.push({
            eventType: 'FACE_ABSENT',
            timestamp: new Date(),
            confidence: 0.9,
            duration: Math.floor((currentTime - this.noFaceStartTime) / 1000)
          });
          this.noFaceStartTime = null;
        }
      } else {
        this.noFaceStartTime = null;
        this.lastFaceTime = currentTime;
      }

      if (faces.length > 1) {
        events.push({
          eventType: 'MULTIPLE_FACES',
          timestamp: new Date(),
          confidence: 0.8,
          metadata: {
            objectType: `${faces.length} faces detected`
          }
        });
      }

      if (faces.length === 1) {
        const isLookingAway = await this.checkFocusLoss(faces[0], canvas);
        if (isLookingAway) {
          if (this.focusLostStartTime === null) {
            this.focusLostStartTime = currentTime;
          } else if (currentTime - this.focusLostStartTime > 5000) {
            events.push({
              eventType: 'FOCUS_LOST',
              timestamp: new Date(),
              confidence: 0.7,
              duration: Math.floor((currentTime - this.focusLostStartTime) / 1000)
            });
            this.focusLostStartTime = null;
          }
        } else {
          this.focusLostStartTime = null;
          this.lastFocusTime = currentTime;
        }
      }

    } catch (error) {
      console.error('Face detection error:', error);
    }

    return events;
  }

  private async simpleFaceDetection(imageData: ImageData): Promise<any[]> {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let brightness = 0;
    let skinColorPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      brightness += (r + g + b) / 3;
      
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15) {
        skinColorPixels++;
      }
    }
    
    brightness = brightness / (pixels.length / 4);
    const skinColorRatio = skinColorPixels / (pixels.length / 4);
    
    if (brightness < 30) {
      return [];
    }
    
    if (skinColorRatio > 0.05 && brightness > 50) {
      return [{ x: 100, y: 100, width: 200, height: 200 }];
    }
    
    return [];
  }

  private async checkFocusLoss(face: any, canvas: HTMLCanvasElement): Promise<boolean> {
    const ctx = canvas.getContext('2d')!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerRegion = 100;
    
    const centerImageData = ctx.getImageData(
      centerX - centerRegion/2, 
      centerY - centerRegion/2, 
      centerRegion, 
      centerRegion
    );
    
    const pixels = centerImageData.data;
    let skinColorPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15) {
        skinColorPixels++;
      }
    }
    
    const centerSkinRatio = skinColorPixels / (pixels.length / 4);
    const isLookingAway = centerSkinRatio < 0.1;
    
    return isLookingAway;
  }
}

export class ObjectDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading: boolean = false;
  private detectionRunning: boolean = false;

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    this.isLoading = true;
    try {
      await tf.ready();
      this.model = await cocoSsd.load();
    } catch (error) {
      console.error('Failed to load COCO-SSD', error);
    } finally {
      this.isLoading = false;
    }
  }

  async detectObjects(videoElement: HTMLVideoElement): Promise<DetectionEvent[]> {
    if (!this.model) {
      return [];
    }

    try {
      const predictions = await this.model.detect(videoElement);
      const events: DetectionEvent[] = [];

      const suspiciousItems = predictions.filter(prediction => {
        const className = prediction.class.toLowerCase();
        return ['cell phone', 'book', 'laptop', 'tablet', 'mouse', 'keyboard', 'remote'].includes(className);
      });

      suspiciousItems.forEach(item => {
        let eventType: DetectionEvent['eventType'] = 'DEVICE_DETECTED';
        
        if (item.class.toLowerCase().includes('phone')) {
          eventType = 'PHONE_DETECTED';
        } else if (item.class.toLowerCase().includes('book')) {
          eventType = 'BOOK_DETECTED';
        }

        events.push({
          eventType,
          timestamp: new Date(),
          confidence: item.score,
          metadata: {
            objectType: item.class,
            boundingBox: {
              x: item.bbox[0],
              y: item.bbox[1],
              width: item.bbox[2],
              height: item.bbox[3]
            }
          }
        });
      });

      return events;
    } catch (error) {
      console.error('Object detection error', error);
      return [];
    }
  }

  startDetection(videoElement: HTMLVideoElement, onEventsDetected: (events: DetectionEvent[]) => void): void {
    if (this.detectionRunning) return;
    
    this.detectionRunning = true;

    const runDetection = async () => {
      if (!this.detectionRunning) return;
      
      try {
        const events = await this.detectObjects(videoElement);
        if (events.length > 0) {
          onEventsDetected(events);
        }
      } catch (error) {
        console.error('Detection loop error:', error);
      }
      
      if (this.detectionRunning) {
        setTimeout(runDetection, 3000);
      }
    };

    runDetection();
  }

  stopDetection(): void {
    this.detectionRunning = false;
  }
}

export class DetectionManager {
  private faceService: FaceDetectionService;
  private objectService: ObjectDetectionService;
  private isRunning: boolean = false;
  private detectionInterval: NodeJS.Timeout | null = null;
  private lastEventTimestamps: Map<string, number> = new Map();

  constructor() {
    this.faceService = new FaceDetectionService();
    this.objectService = new ObjectDetectionService();
  }

  async initialize(): Promise<void> {
    await this.objectService.loadModel();
  }

  private isDuplicateEvent(event: DetectionEvent): boolean {
    const eventKey = `${event.eventType}-${event.metadata?.objectType || 'default'}`;
    const now = Date.now();
    const lastTime = this.lastEventTimestamps.get(eventKey);
    
    if (lastTime && now - lastTime < 5000) {
      return true;
    }
    
    this.lastEventTimestamps.set(eventKey, now);
    return false;
  }

  startDetection(videoElement: HTMLVideoElement, onEventsDetected: (events: DetectionEvent[]) => void): void {
    if (this.isRunning) return;
    
    this.isRunning = true;

    this.detectionInterval = setInterval(async () => {
      try {
        const [faceEvents, objectEvents] = await Promise.all([
          this.faceService.detectFaces(videoElement),
          this.objectService.detectObjects(videoElement)
        ]);

        const allEvents = [...faceEvents, ...objectEvents];
        const uniqueEvents = allEvents.filter(event => !this.isDuplicateEvent(event));
        
        if (uniqueEvents.length > 0) {
          onEventsDetected(uniqueEvents);
        }

      } catch (error) {
        console.error('Detection manager error:', error);
      }
    }, 2000);
  }

  stopDetection(): void {
    this.isRunning = false;
    this.lastEventTimestamps.clear();
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }
}