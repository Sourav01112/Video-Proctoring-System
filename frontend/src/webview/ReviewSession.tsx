import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { VideoPlayer } from '../components/VideoPlayer';
import type { ReviewInterview } from '../types';
import { generatePDFReport } from '../components/GenratePDF';


export const ReviewSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<ReviewInterview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (id) {
      loadInterviewDetails();
    }
  }, [id]);

  const loadInterviewDetails = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getInterviewForReview(id!);
      setInterview(data);
    } catch (err) {
      console.error('Failed to load interview details:', err);
      setError('Failed to load interview details');
    } finally {
      setIsLoading(false);
    }
  };



  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'PASS': return '#28a745';
      case 'REVIEW': return '#ffc107';
      case 'FAIL': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

const downloadReport = () => {
  if (!interview) return;
  
  generatePDFReport(interview);
};


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Interview Details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <div className="text-gray-400 text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Not Found</h2>
          <button 
            onClick={() => navigate('/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/admin')} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded mr-4 text-sm font-medium"
              >
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Interview Review</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={downloadReport} 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Download Report
              </button>
              {interview.hasVideo && (
                <button 
                  onClick={() => setShowVideo(!showVideo)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {showVideo ? 'Hide Video' : 'Show Video'}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Candidate:</label>
                <span className="text-gray-800 font-semibold">{interview.candidateName}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Interviewer:</label>
                <span className="text-gray-800 font-semibold">{interview.interviewerName}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Date:</label>
                <span className="text-gray-800 font-semibold">{new Date(interview.startTime).toLocaleDateString()}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Duration:</label>
                <span className="text-gray-800 font-semibold">{interview.duration} minutes</span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Integrity Score:</label>
                <span 
                  className="text-2xl font-bold"
                  style={{ color: getRecommendationColor(interview.recommendation) }}
                >
                  {interview.integrityScore}%
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-600 block mb-1">Recommendation:</label>
                <span 
                  className="inline-block px-3 py-1 rounded text-sm font-semibold text-white"
                  style={{ backgroundColor: getRecommendationColor(interview.recommendation) }}
                >
                  {interview.recommendation}
                </span>
              </div>
            </div>
          </div>

          {showVideo && interview.hasVideo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Video</h2>
              <VideoPlayer 
                videoUrl={adminApi.getVideoUrl(interview._id)}
                events={interview.events}
                duration={interview.duration * 60} // Convert to seconds
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Interview Summary</h2>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded">{interview.summary}</p>
          </div>

        

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Timeline</h2>
            <div className="max-h-96 overflow-y-auto">
              {interview.events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-2xl mb-2">✅</div>
                  <p className="text-gray-600">No violations detected during this interview.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interview.events.map((event, index) => (
                    <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{formatEventType(event.eventType)}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Confidence: <span className="font-medium">{Math.round(event.confidence * 100)}%</span></p>
                        {event.duration && <p>Duration: <span className="font-medium">{event.duration}s</span></p>}
                        {event.metadata?.objectType && (
                          <p>Object: <span className="font-medium">{event.metadata.objectType}</span></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        
        </div>
      </div>
    </div>
  );
};