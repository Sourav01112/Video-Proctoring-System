import axios from 'axios';
import type { DetectionEvent, InterviewResponse, ReportResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const interviewApi = {
  startInterview: (candidateName: string): Promise<InterviewResponse> =>
    api.post('/interviews', { candidateName }).then(res => res.data),

  getInterview: (id: string) =>
    api.get(`/interviews/${id}`).then(res => res.data),

  logEvent: (interviewId: string, event: DetectionEvent) =>
    api.post(`/interviews/${interviewId}/events`, event).then(res => res.data),

  uploadVideo: (interviewId: string, videoBlob: Blob) => {
    const formData = new FormData();
    formData.append('video', videoBlob, 'interview-recording.webm');
    return api.post(`/interviews/${interviewId}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },


  generateReport: (interviewId: string): Promise<ReportResponse> =>
    api.get(`/interviews/${interviewId}/report`).then(res => res.data),
};


export const roomApi = {
  createRoom: (candidateName: string, interviewerName: string) =>
    axios.post(`${API_BASE}/rooms`, { candidateName, interviewerName }).then(res => res.data),

  getRoomInfo: (roomId: string) =>
    axios.get(`${API_BASE}/rooms/${roomId}`).then(res => res.data),

  joinRoom: (roomId: string) =>
    axios.post(`${API_BASE}/rooms/${roomId}/join`).then(res => res.data),

  endInterview: (roomId: string) =>
    axios.post(`${API_BASE}/rooms/${roomId}/end`).then(res => res.data),
};



export const adminApi = {
  getAllInterviews: (params?: any) => 
    axios.get(`${API_BASE}/admin/interviews`, { params }).then(res => res.data),

  getDashboardStats: () => 
    axios.get(`${API_BASE}/admin/dashboard`).then(res => res.data),

  getInterviewForReview: (id: string) => 
    axios.get(`${API_BASE}/admin/interviews/${id}`).then(res => res.data),

  getVideoUrl: (interviewId: string): string =>
    `${API_BASE}/interviews/${interviewId}/video`,
};

