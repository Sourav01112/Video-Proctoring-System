import React, { useRef, useEffect, useState } from 'react';
import type { VideoPlayerProps } from '../types';


export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, events, duration }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const getEventAtTime = (time: number) => {
    return events.find(event => {
      const eventTime = (new Date(event.timestamp).getTime() - new Date(events[0]?.timestamp).getTime()) / 1000;
      return Math.abs(eventTime - time) < 5; 
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToEvent = (event: any) => {
    if (!videoRef.current || events.length === 0) return;
    
    const eventTime = (new Date(event.timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000;
    videoRef.current.currentTime = Math.max(0, eventTime);
  };

  const currentEvent = getEventAtTime(currentTime);

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          controls
          className="w-full max-h-[500px] object-contain"
        >
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/mp4" />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            Your browser does not support the video.
          </div>
        </video>

        {currentEvent && showEvents && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-semibold">
              {currentEvent.eventType.replace(/_/g, ' ')}
            </div>
            <div className="text-xs">
              Confidence: {Math.round(currentEvent.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
         
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="border-b border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-800">Event Timeline</h4>
        </div>
        
        <div className="p-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events recorded during this interview
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((event, index) => {
                const eventTime = events.length > 0 
                  ? (new Date(event.timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000
                  : 0;
                
                return (
                  <div 
                    key={index} 
                    onClick={() => jumpToEvent(event)}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-blue-600">
                        {formatTime(eventTime)}
                      </div>
                      <div className="text-sm text-gray-800">
                        {event.eventType.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(event.confidence * 100)}% confidence
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};