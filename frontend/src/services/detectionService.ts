import type { DetectionEvent } from '../types';
declare global {
  interface Window {
    tf: any;
    cocoSsd: any;
  }
}

class TensorFlowCDNLoader {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      
      await this.waitForCDNGlobals();
      
      if (!window.tf) {
        throw new Error('TensorFlow.js not loaded from CDN - check index.html scripts');
      }
      
      const tf = window.tf;
      console.log('TensorFlow.js found from CDN');
      
      console.log('Registering WebGL backend...');
      if (window.tf && window.tf.registerBackend) {
        await tf.registerBackend('webgl');
      }
      
      console.log('Setting WebGL backend...');
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js initialized with WebGL backend');
      } catch (webglError) {
        console.error('WebGL initialization failed:', webglError);
        
        try {
          console.log('Falling back to CPU backend...');
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('TensorFlow.js initialized with CPU backend (slower but works)');
        } catch (cpuError: any) {
          console.error('CPU fallback also failed:', cpuError);
          throw new Error(`TensorFlow.js failed to initialize: ${cpuError.message}`);
        }
      }
      
      if (!window.cocoSsd) {
        throw new Error('COCO-SSD not loaded from CDN');
      }
      
      this.initialized = true;
      console.log('TensorFlow.js CDN initialization complete');
      
    } catch (error) {
      console.error('CDN initialization failed:', error);
      this.initialized = false;
      throw error;
    }
  }

  private static waitForCDNGlobals(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; 

      console.log('Waiting for CDN globals (window.tf, window.cocoSsd)...');

      const checkGlobals = () => {
        const hasTf = typeof window.tf !== 'undefined';
        const hasCocoSsd = typeof window.cocoSsd !== 'undefined';
        
        if (hasTf && hasCocoSsd) {
          console.log('CDN globals loaded: tf and cocoSsd available');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('CDN globals timed out after 10 seconds'));
        } else {
          attempts++;
          setTimeout(checkGlobals, 100);
        }
      };

      checkGlobals();
    });
  }

  static getTF(): any {
    if (!this.initialized) {
      throw new Error('TensorFlow.js CDN not initialized. Call initialize() first.');
    }
    if (!window.tf) {
      throw new Error('window.tf not available - CDN failed to load');
    }
    return window.tf;
  }

  static getCocoSsd(): any {
    if (!this.initialized) {
      throw new Error('COCO-SSD CDN not initialized. Call initialize() first.');
    }
    if (!window.cocoSsd) {
      throw new Error('window.cocoSsd not available - CDN failed to load');
    }
    return window.cocoSsd;
  }

  static isReady(): boolean {
    return this.initialized && !!window.tf && !!window.cocoSsd;
  }
}

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
  private model: any = null;
  private isLoading: boolean = false;
  private detectionRunning: boolean = false;

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    this.isLoading = true;
    try {
      console.log('Initializing TensorFlow.js for object detection...');
      
      await TensorFlowCDNLoader.initialize();
      
      console.log('Loading COCO-SSD model from CDN...');
      this.model = await TensorFlowCDNLoader.getCocoSsd().load();
      
      console.log('COCO-SSD model loaded successfully from CDN');
    } catch (error) {
      console.error('Failed to load COCO-SSD:', error);
      this.model = null;
    } finally {
      this.isLoading = false;
    }
  }

  async detectObjects(videoElement: HTMLVideoElement): Promise<DetectionEvent[]> {
    if (!this.model) {
      console.warn('Model not loaded - call loadModel() first');
      return [];
    }

    try {
      const predictions = await this.model.detect(videoElement);
      const events: DetectionEvent[] = [];

      const suspiciousItems = predictions.filter((prediction: any) => {
        const className = prediction.class.toLowerCase();
        return ['cell phone', 'book', 'laptop', 'tablet', 'mouse', 'keyboard', 'remote'].includes(className);
      });

      suspiciousItems.forEach((item: any) => {
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
      console.error('Object detection error:', error);
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

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      console.log('🧹 COCO-SSD model disposed');
    }
  }
}

export class DetectionManager {
  private faceService: FaceDetectionService;
  private objectService: ObjectDetectionService;
  private isRunning: boolean = false;
  private detectionInterval: number | null = null;
  
  private lastEventTimestamps: Map<string, number> = new Map();

  constructor() {
    this.faceService = new FaceDetectionService();
    this.objectService = new ObjectDetectionService();
  }

  async initialize(): Promise<void> {
    console.log('Initializing DetectionManager with CDN...');
    await this.objectService.loadModel();
    console.log('DetectionManager initialized successfully with CDN');
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
          console.log('📱 Detected events:', uniqueEvents);
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
    this.objectService.stopDetection();
  }

  dispose(): void {
    this.stopDetection();
    this.objectService.dispose();
  }

  isCDNReady(): boolean {
    return TensorFlowCDNLoader.isReady();
  }

  getBackendInfo(): string {
    try {
      return TensorFlowCDNLoader.getTF().getBackend();
    } catch {
      return 'TensorFlow.js not initialized';
    }
  }
}









// import '@tensorflow/tfjs-backend-webgl';
// import * as tf from '@tensorflow/tfjs';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import type { DetectionEvent } from '../types';

// export class FaceDetectionService {
//   private lastFaceTime: number = Date.now();
//   private lastFocusTime: number = Date.now();
//   private noFaceStartTime: number | null = null;
//   private focusLostStartTime: number | null = null;

//   async detectFaces(videoElement: HTMLVideoElement): Promise<DetectionEvent[]> {
//     const events: DetectionEvent[] = [];
//     const currentTime = Date.now();

//     try {
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d')!;
//       canvas.width = videoElement.videoWidth;
//       canvas.height = videoElement.videoHeight;
//       ctx.drawImage(videoElement, 0, 0);

//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const faces = await this.simpleFaceDetection(imageData);

//       if (faces.length === 0) {
//         if (this.noFaceStartTime === null) {
//           this.noFaceStartTime = currentTime;
//         } else if (currentTime - this.noFaceStartTime > 10000) {
//           events.push({
//             eventType: 'FACE_ABSENT',
//             timestamp: new Date(),
//             confidence: 0.9,
//             duration: Math.floor((currentTime - this.noFaceStartTime) / 1000)
//           });
//           this.noFaceStartTime = null;
//         }
//       } else {
//         this.noFaceStartTime = null;
//         this.lastFaceTime = currentTime;
//       }

//       if (faces.length > 1) {
//         events.push({
//           eventType: 'MULTIPLE_FACES',
//           timestamp: new Date(),
//           confidence: 0.8,
//           metadata: {
//             objectType: `${faces.length} faces detected`
//           }
//         });
//       }

//       if (faces.length === 1) {
//         const isLookingAway = await this.checkFocusLoss(faces[0], canvas);
//         if (isLookingAway) {
//           if (this.focusLostStartTime === null) {
//             this.focusLostStartTime = currentTime;
//           } else if (currentTime - this.focusLostStartTime > 5000) {
//             events.push({
//               eventType: 'FOCUS_LOST',
//               timestamp: new Date(),
//               confidence: 0.7,
//               duration: Math.floor((currentTime - this.focusLostStartTime) / 1000)
//             });
//             this.focusLostStartTime = null;
//           }
//         } else {
//           this.focusLostStartTime = null;
//           this.lastFocusTime = currentTime;
//         }
//       }

//     } catch (error) {
//       console.error('Face detection error:', error);
//     }

//     return events;
//   }

//   private async simpleFaceDetection(imageData: ImageData): Promise<any[]> {
//     const pixels = imageData.data;
//     const width = imageData.width;
//     const height = imageData.height;
    
//     let brightness = 0;
//     let skinColorPixels = 0;
    
//     for (let i = 0; i < pixels.length; i += 4) {
//       const r = pixels[i];
//       const g = pixels[i + 1];
//       const b = pixels[i + 2];
      
//       brightness += (r + g + b) / 3;
      
//       if (r > 95 && g > 40 && b > 20 && 
//           r > g && r > b && 
//           Math.abs(r - g) > 15) {
//         skinColorPixels++;
//       }
//     }
    
//     brightness = brightness / (pixels.length / 4);
//     const skinColorRatio = skinColorPixels / (pixels.length / 4);
    
//     if (brightness < 30) {
//       return [];
//     }
    
//     if (skinColorRatio > 0.05 && brightness > 50) {
//       return [{ x: 100, y: 100, width: 200, height: 200 }];
//     }
    
//     return [];
//   }

//   private async checkFocusLoss(face: any, canvas: HTMLCanvasElement): Promise<boolean> {
//     const ctx = canvas.getContext('2d')!;
//     const centerX = canvas.width / 2;
//     const centerY = canvas.height / 2;
//     const centerRegion = 100;
    
//     const centerImageData = ctx.getImageData(
//       centerX - centerRegion/2, 
//       centerY - centerRegion/2, 
//       centerRegion, 
//       centerRegion
//     );
    
//     const pixels = centerImageData.data;
//     let skinColorPixels = 0;
    
//     for (let i = 0; i < pixels.length; i += 4) {
//       const r = pixels[i];
//       const g = pixels[i + 1];
//       const b = pixels[i + 2];
      
//       if (r > 95 && g > 40 && b > 20 && 
//           r > g && r > b && 
//           Math.abs(r - g) > 15) {
//         skinColorPixels++;
//       }
//     }
    
//     const centerSkinRatio = skinColorPixels / (pixels.length / 4);
//     const isLookingAway = centerSkinRatio < 0.1;
    
//     return isLookingAway;
//   }
// }

// export class ObjectDetectionService {
//   private model: cocoSsd.ObjectDetection | null = null;
//   private isLoading: boolean = false;
//   private detectionRunning: boolean = false;

//   async loadModel(): Promise<void> {
//     if (this.model || this.isLoading) return;
    
//     this.isLoading = true;
//     try {
//       await tf.ready();
//       this.model = await cocoSsd.load();
//     } catch (error) {
//       console.error('Failed to load COCO-SSD', error);
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   async detectObjects(videoElement: HTMLVideoElement): Promise<DetectionEvent[]> {
//     if (!this.model) {
//       return [];
//     }

//     try {
//       const predictions = await this.model.detect(videoElement);
//       const events: DetectionEvent[] = [];

//       const suspiciousItems = predictions.filter(prediction => {
//         const className = prediction.class.toLowerCase();
//         return ['cell phone', 'book', 'laptop', 'tablet', 'mouse', 'keyboard', 'remote'].includes(className);
//       });

//       suspiciousItems.forEach(item => {
//         let eventType: DetectionEvent['eventType'] = 'DEVICE_DETECTED';
        
//         if (item.class.toLowerCase().includes('phone')) {
//           eventType = 'PHONE_DETECTED';
//         } else if (item.class.toLowerCase().includes('book')) {
//           eventType = 'BOOK_DETECTED';
//         }

//         events.push({
//           eventType,
//           timestamp: new Date(),
//           confidence: item.score,
//           metadata: {
//             objectType: item.class,
//             boundingBox: {
//               x: item.bbox[0],
//               y: item.bbox[1],
//               width: item.bbox[2],
//               height: item.bbox[3]
//             }
//           }
//         });
//       });

//       return events;
//     } catch (error) {
//       console.error('Object detection error', error);
//       return [];
//     }
//   }

//   startDetection(videoElement: HTMLVideoElement, onEventsDetected: (events: DetectionEvent[]) => void): void {
//     if (this.detectionRunning) return;
    
//     this.detectionRunning = true;

//     const runDetection = async () => {
//       if (!this.detectionRunning) return;
      
//       try {
//         const events = await this.detectObjects(videoElement);
//         if (events.length > 0) {
//           onEventsDetected(events);
//         }
//       } catch (error) {
//         console.error('Detection loop error:', error);
//       }
      
//       if (this.detectionRunning) {
//         setTimeout(runDetection, 3000);
//       }
//     };

//     runDetection();
//   }

//   stopDetection(): void {
//     this.detectionRunning = false;
//   }
// }

// export class DetectionManager {
//   private faceService: FaceDetectionService;
//   private objectService: ObjectDetectionService;
//   private isRunning: boolean = false;
//   private detectionInterval: NodeJS.Timeout | null = null;
//   private lastEventTimestamps: Map<string, number> = new Map();

//   constructor() {
//     this.faceService = new FaceDetectionService();
//     this.objectService = new ObjectDetectionService();
//   }

//   async initialize(): Promise<void> {
//     await this.objectService.loadModel();
//   }

//   private isDuplicateEvent(event: DetectionEvent): boolean {
//     const eventKey = `${event.eventType}-${event.metadata?.objectType || 'default'}`;
//     const now = Date.now();
//     const lastTime = this.lastEventTimestamps.get(eventKey);
    
//     if (lastTime && now - lastTime < 5000) {
//       return true;
//     }
    
//     this.lastEventTimestamps.set(eventKey, now);
//     return false;
//   }

//   startDetection(videoElement: HTMLVideoElement, onEventsDetected: (events: DetectionEvent[]) => void): void {
//     if (this.isRunning) return;
    
//     this.isRunning = true;

//     this.detectionInterval = setInterval(async () => {
//       try {
//         const [faceEvents, objectEvents] = await Promise.all([
//           this.faceService.detectFaces(videoElement),
//           this.objectService.detectObjects(videoElement)
//         ]);

//         const allEvents = [...faceEvents, ...objectEvents];
//         const uniqueEvents = allEvents.filter(event => !this.isDuplicateEvent(event));
        
//         if (uniqueEvents.length > 0) {
//           onEventsDetected(uniqueEvents);
//         }

//       } catch (error) {
//         console.error('Detection manager error:', error);
//       }
//     }, 2000);
//   }

//   stopDetection(): void {
//     this.isRunning = false;
//     this.lastEventTimestamps.clear();
//     if (this.detectionInterval) {
//       clearInterval(this.detectionInterval);
//       this.detectionInterval = null;
//     }
//   }
// }