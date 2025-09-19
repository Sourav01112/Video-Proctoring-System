import React, { useRef, useEffect, useState } from 'react';
import { useDetection } from '../hooks/useDetection';
import { useVideoRecording } from '../hooks/useVideoRecording';
import type { DetectionEvent, VideoCaptureProps } from '../types';



export const VideoCapture: React.FC<VideoCaptureProps> = ({ 
  onDetection, 
  isActive, 
  onVideoReady,
  showVideo = true,
  roomId
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const { isRecording, recordedBlob, startRecording, stopRecording } = useVideoRecording();

  useDetection({
    videoElement: videoRef.current,
    onDetection,
    isActive: isActive && !!stream
  });

  useEffect(() => {
    if (recordedBlob && onVideoReady) {
      onVideoReady(recordedBlob);
    }
  }, [recordedBlob, onVideoReady]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }


      } catch (err) {
        setError('Failed to access camera. Please allow camera permissions.');
        console.error('error', err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

    };
  }, [roomId]);


  useEffect(() => {
    if (isActive && stream && !isRecording) {
      startRecording(stream);
    } else if (!isActive && isRecording) {
      stopRecording();
    }
  }, [isActive, stream, isRecording, startRecording, stopRecording]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-4xl mb-3"></div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
        <p className="text-red-700">{error}</p>
        <p className="text-sm text-red-600 mt-2">
          Please refresh the page and allow camera access to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showVideo && (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-2xl mx-auto object-cover rounded-lg"
          />
          
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">REC</span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            {stream ? (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Camera Active</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Connecting...</span>
              </span>
            )}
          </div>

          {isActive && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>AI Monitoring</span>
              </span>
            </div>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
        <div className={`p-3 rounded-lg text-center ${
          stream 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className={`text-sm font-medium ${
            stream ? 'text-green-800' : 'text-yellow-800'
          }`}>
            Video Stream
          </div>
          <div className={`text-xs ${
            stream ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {stream ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        <div className={`p-3 rounded-lg text-center ${
          isRecording 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-sm font-medium ${
            isRecording ? 'text-red-800' : 'text-gray-600'
          }`}>
            Recording
          </div>
          <div className={`text-xs ${
            isRecording ? 'text-red-600' : 'text-gray-500'
          }`}>
            {isRecording ? 'Active' : 'Standby'}
          </div>
        </div>

        <div className={`p-3 rounded-lg text-center ${
          isActive 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-sm font-medium ${
            isActive ? 'text-blue-800' : 'text-gray-600'
          }`}>
            AI Detection
          </div>
          <div className={`text-xs ${
            isActive ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {isActive ? 'Monitoring' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
};