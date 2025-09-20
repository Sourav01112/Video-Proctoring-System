import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VideoCapture } from '../components/VideoCapture';
import { interviewApi, roomApi } from '../services/api';
import { socketService } from '../services/socketService';
import type { DetectionEvent } from '../types';

export const CandidateView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomId) {
        setError('Invalid room ID');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Candidate initializing room:', roomId);

        const roomData = await roomApi.getRoomInfo(roomId);
        console.log('Room data>>>', roomData);
        setRoomInfo(roomData);

        const joinResult = await roomApi.joinRoom(roomId);
        console.log('Join result>>', joinResult);
        setRoomInfo((prev: any) => ({ ...prev, ...joinResult }));
        socketService.connect();
        socketService.joinRoom(roomId, 'candidate');
        socketService.onInterviewEnded(() => {
          console.log('ended signal received.. stopping recording');
          setIsVideoRecording(false);
          setTimeout(() => {
            setInterviewEnded(true);
          }, 3000);
        });

      } catch (err: any) {
        console.error('Room initialization error+++', err);
        setError(err.response?.data?.error || 'Failed to join interview room');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();

    return () => {
      socketService.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (roomInfo?.interviewId && !interviewEnded) {
      console.log('Starting video recording for interview', roomInfo.interviewId);
      setIsVideoRecording(true);
    }
  }, [roomInfo, interviewEnded]);

  const handleDetection = async (event: DetectionEvent) => {
    console.log('Detection event triggered:', event);

    if (!roomInfo?.interviewId || !roomId) {
      console.log('Missing roomInfo or roomId for detection:', { roomInfo, roomId });
      return;
    }

    try {
      console.log('Logging event to database...');
      await interviewApi.logEvent(roomInfo.interviewId, event);
      console.log('Event logged to database successfully');

      console.log('Sending detection event via socket...');
      socketService.sendDetectionEvent(roomId, event.eventType, event.timestamp, event.confidence);
      console.log('Detection event sent via socket successfully');

    } catch (error) {
      console.error('Failed to handle detection event:', error);
    }
  };

  const handleVideoReady = async (videoBlob: Blob) => {
    if (!roomInfo?.interviewId) {
      console.log('No interview ID available for video upload');
      return;
    }

    try {
      console.log('Uploading video blob, size:', videoBlob.size, 'bytes');
      const response = await interviewApi.uploadVideo(roomInfo.interviewId, videoBlob);
      console.log('Video uploaded successfully:', response);
      
      alert('Interview video saved successfully!');
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to save interview video. Please contact support.');
    }
  };
if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to Interview Room...</h2>
        <p className="text-gray-600">Please wait while we set up your interview session.</p>
        <div className="mt-4 bg-blue-50 rounded p-3">
          <div className="flex items-center justify-center text-sm text-blue-700">
            <span className="mr-2">🔄</span>
            Preparing your interview environment
          </div>
        </div>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Join Interview</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
        <p className="text-gray-600 mb-4">Please check your interview link and try again.</p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center">
            <span className="mr-2"></span>
            Verify the interview link is correct
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2"></span>
            Try refreshing the page
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2"></span>
            Contact your interviewer if issues persist
          </div>
        </div>
      </div>
    </div>
  );
}

if (interviewEnded) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
        <div className="text-green-500 text-4xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Interview Completed</h2>
        <p className="text-gray-600 mb-6">Thank you for participating in the interview!</p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="text-green-800 font-medium mb-2">Session Summary</div>
          <div className="text-sm text-green-700 space-y-1">
            <div>Your responses have been recorded</div>
            <div>The interviewer will review your session</div>
            <div>You will be contacted with next steps</div>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}
  return (

<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
  <div className="max-w-6xl mx-auto">
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview in Progress</h1>
      <p className="text-gray-600 text-lg">
        Hello <strong className="text-blue-600">{roomInfo?.candidateName}</strong>, please look at the camera and answer the interviewer's questions clearly.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <VideoCapture
            onDetection={handleDetection}
            isActive={isVideoRecording}
            onVideoReady={handleVideoReady}
            showVideo={true}
            roomId={roomId}
          />
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Interview Guidelines
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 font-semibold">✅</span>
              <span className="text-gray-700 text-sm">Keep your face clearly visible in the camera</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500 font-semibold">✅</span>
              <span className="text-gray-700 text-sm">Look directly at the camera when speaking</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500 font-semibold">✅</span>
              <span className="text-gray-700 text-sm">Ensure good lighting on your face</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500 font-semibold">✅</span>
              <span className="text-gray-700 text-sm">Stay in frame throughout the interview</span>
            </div>
            
            <hr className="my-4 border-gray-200" />
            
            <div className="flex items-start space-x-3">
              <span className="text-red-500 font-semibold">❌</span>
              <span className="text-gray-700 text-sm">Do not use phones, books, or other devices</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-red-500 font-semibold">❌</span>
              <span className="text-gray-700 text-sm">Do not have other people in the frame</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-red-500 font-semibold">❌</span>
              <span className="text-gray-700 text-sm">Do not look away from camera for extended periods</span>
            </div>
          </div>

        
        </div>
      </div>
    </div>
  </div>
</div>







  );
};