import { useState, useCallback } from 'react';
import { interviewApi } from '../services/api';
import type { InterviewResponse, DetectionEvent, ReportResponse } from '../types';

export const useInterview = () => {
  const [interview, setInterview] = useState<InterviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startInterview = useCallback(async (candidateName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await interviewApi.startInterview(candidateName);
      setInterview(response);
      return response;
    } catch (err) {
      setError('Failed to start interview');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logEvent = useCallback(async (event: DetectionEvent) => {
    if (!interview) return;
    
    try {
      await interviewApi.logEvent(interview.interviewId, event);
    } catch (err) {
      console.error('Failed to log event', err);
    }
  }, [interview]);

  const uploadVideo = useCallback(async (videoBlob: Blob) => {
    if (!interview) return;

    setIsLoading(true);
    try {
      await interviewApi.uploadVideo(interview.interviewId, videoBlob);
    } catch (err) {
      setError('Failed to upload video');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [interview]);

  const generateReport = useCallback(async (): Promise<ReportResponse | null> => {
    if (!interview) return null;

    setIsLoading(true);
    try {
      const report = await interviewApi.generateReport(interview.interviewId);
      return report;
    } catch (err) {
      setError('Failed to generate report');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [interview]);

  return {
    interview,
    isLoading,
    error,
    startInterview,
    logEvent,
    uploadVideo,
    generateReport
  };
};