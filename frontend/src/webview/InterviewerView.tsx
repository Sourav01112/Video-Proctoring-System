import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewApi, roomApi } from '../services/api';
import { socketService } from '../services/socketService';
import type { Alert } from '../types';



export const InterviewerView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [candidateConnected, setCandidateConnected] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!roomId) {
        setError('Invalid room ID');
        setIsLoading(false);
        return;
      }

      try {
        const roomData = await roomApi.getRoomInfo(roomId);
        console.log('Interviewer - Room data>>>', roomData);
        setRoomInfo(roomData);

        socketService.connect();
        socketService.joinRoom(roomId, 'interviewer');
        socketService.onCandidateAlert((data) => {
          console.log('Received candidate alert>>', data);
          const newAlert: Alert = {
            id: Date.now().toString(),
            type: data.type,
            message: data.message,
            timestamp: new Date(data.timestamp),
            confidence: data.confidence
          };
          setAlerts(prev => [...prev, newAlert]);
        });

        socketService.socket?.on('user-joined', (data: { role: string, socketId: string }) => {
          console.log('User joined:', data);
          if (data.role === 'candidate') {
            setCandidateConnected(true);
          }
        });

      } catch (err: any) {
        console.error('Dashboard initialization error:', err);
        setError(err.response?.data?.error || 'Failed to load interviewer dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      socketService.disconnect();
    };
  }, [roomId]);

  const handleEndInterview = async () => {
    if (!roomId) return;

    const confirmEnd = window.confirm(
      'Are you sure you want to end this interview? This action cannot be undone.'
    );

    if (!confirmEnd) return;

    setIsEnding(true);
    try {
      await roomApi.endInterview(roomId);

      socketService.endInterview(roomId);

      setTimeout(() => {
        navigate("/admin")
      }, 2000)
    } catch (error) {
      console.error('Failed to end interview:', error);
      alert('Failed to end interview. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'FOCUS_LOST': return '👁️';
      case 'FACE_ABSENT': return '😶';
      case 'MULTIPLE_FACES': return '👥';
      case 'PHONE_DETECTED': return '📱';
      case 'BOOK_DETECTED': return '📚';
      case 'DEVICE_DETECTED': return '💻';
      default: return '⚠️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'FOCUS_LOST': return '#ff9800';
      case 'FACE_ABSENT': return '#f44336';
      case 'MULTIPLE_FACES': return '#e91e63';
      case 'PHONE_DETECTED': return '#f44336';
      case 'BOOK_DETECTED': return '#ff5722';
      case 'DEVICE_DETECTED': return '#f44336';
      default: return '#757575';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="interviewer-loading">
        <h2>Loading Interviewer Dashboard...</h2>
        <p>Setting up monitoring interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interviewer-error">
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
    <header className="bg-white rounded-lg shadow mb-6 p-6">
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-3">Interview Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
          <span className="text-slate-700 font-medium">Room: {roomInfo?.roomId}</span>
        </div>
        <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
          <span className="text-gray-700 font-medium">Candidate: {roomInfo?.candidateName}</span>
        </div>
        <div className="bg-stone-50 px-3 py-2 rounded border border-stone-200">
          <span className="text-stone-700 font-medium">Interviewer: {roomInfo?.interviewerName}</span>
        </div>
      
      </div>
    </div>
    <button
      onClick={handleEndInterview}
      disabled={isEnding || roomInfo?.status === 'completed'}
      className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium"
    >
      {isEnding ? 'Ending...' : 'End Interview'}
    </button>
  </div>
</header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Monitoring</h2>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className={`flex items-center px-3 py-2 rounded text-sm font-medium ${candidateConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                <span className="mr-2">{candidateConnected ? '🟢' : '🔴'}</span>
                Candidate: {candidateConnected ? 'Connected' : 'Waiting...'}
              </div>
             
            </div>

            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <span className="text-4xl">📹</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Video Recording Only</h3>
                <p className="text-gray-600 mb-4">
                  Candidate video is being recorded for later review. Monitor real-time alerts in the sidebar.
                </p>
                <div className="flex items-center justify-center mb-6">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Recording</span>
                </div>

                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600 mb-2">Candidate Link:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all mb-3">
                    {window.location.origin}/candidate/{roomId}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/candidate/${roomId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Copy Candidate Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Real-time Alerts ({alerts.length})
              </h3>
              <button
                onClick={clearAlerts}
                disabled={alerts.length === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="p-6">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-2xl mb-3">✅</div>
                <p className="text-gray-600 mb-2">No violations detected</p>
                <p className="text-sm text-gray-500 mb-4">Monitoring candidate behavior...</p>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 space-y-1">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🔍</span>
                    AI Detection Active
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">📹</span>
                    Video Recording Active
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⚡</span>
                    Real-time Monitoring
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.slice(-15).reverse().map((alert) => (
                  <div
                    key={alert.id}
                    className="border-l-4 bg-gray-50 p-3 rounded-r"
                    style={{ borderLeftColor: getAlertColor(alert.type) }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 text-lg">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          {alert.message}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{alert.timestamp.toLocaleTimeString()}</span>
                          <span>{Math.round(alert.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {alerts.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Session Summary:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">
                      {alerts.filter(a => a.type === 'FOCUS_LOST').length}
                    </div>
                    <div className="text-xs text-red-700">Focus Issues</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">
                      {alerts.filter(a => a.type === 'FACE_ABSENT').length}
                    </div>
                    <div className="text-xs text-yellow-700">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {alerts.filter(a => ['PHONE_DETECTED', 'BOOK_DETECTED', 'DEVICE_DETECTED'].includes(a.type)).length}
                    </div>
                    <div className="text-xs text-blue-700">Objects</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
