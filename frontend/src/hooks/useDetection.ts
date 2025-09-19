import { useEffect, useRef, useCallback } from 'react';
import { FaceDetectionService, ObjectDetectionService } from '../services/detectionService';
import type { DetectionEvent, UseDetectionProps } from '../types';



export const useDetection = ({ 
  videoElement, 
  onDetection, 
  isActive, 
  interval = 2000 
}: UseDetectionProps) => {
  const faceService = useRef(new FaceDetectionService());
  const objectService = useRef(new ObjectDetectionService());
  const intervalRef = useRef<NodeJS.Timeout>();

  const runDetection = useCallback(async () => {
    if (!videoElement || !isActive) return;

    try {
      const faceEvents = await faceService.current.detectFaces(videoElement);
      faceEvents.forEach(onDetection);

      const objectEvents = await objectService.current.detectObjects(videoElement);
      objectEvents.forEach(onDetection);
    } catch (error) {
      console.error('Detection errorrrr', error);
    }
  }, [videoElement, onDetection, isActive]);

  const startDetection = useCallback(async () => {
    if (!isActive) return;

    try {
      await objectService.current.loadModel();
      console.log('Detection services initialized');

      intervalRef.current = setInterval(runDetection, interval);
    } catch (error) {
      console.error('Failed detection>>>>', error);
    }
  }, [runDetection, isActive, interval]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [isActive, startDetection, stopDetection]);

  return { startDetection, stopDetection };
};