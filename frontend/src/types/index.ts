// frontend/src/types/index.ts
export interface DetectionEvent {
  eventType: "FOCUS_LOST" | "FACE_ABSENT" | "MULTIPLE_FACES" | "PHONE_DETECTED" | "BOOK_DETECTED" | "DEVICE_DETECTED";
  timestamp: Date;
  duration?: number;
  confidence: number;
  metadata?: {
    objectType?: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  confidence: number;
}

export interface InterviewResponse {
  interviewId: string;
  candidateName: string;
  startTime: Date;
  status: "active" | "completed";
}

export interface ReportResponse {
  candidateName: string;
  interviewDuration: number;
  startTime: Date;
  endTime: Date;
  focusLostCount: number;
  totalFocusLostDuration: number;
  faceAbsentCount: number;
  multipleFacesCount: number;
  suspiciousEvents: {
    phoneDetected: number;
    booksDetected: number;
    devicesDetected: number;
  };
  integrityScore: number;
  events: DetectionEvent[];
  summary: string;
  recommendation: "PASS" | "REVIEW" | "FAIL";
}

export interface AlertEvent {
  type: string;
  message: string;
  timestamp: Date;
  confidence: number;
}




export interface ReviewInterview {
  _id: string;
  candidateName: string;
  interviewerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  integrityScore: number;
  hasVideo: boolean;
  videoUrl?: string;
  events: any[];
  eventStats: Record<string, any[]>;
  recommendation: 'PASS' | 'REVIEW' | 'FAIL';
  summary: string;
}


export interface DetectionAlertsProps {
  alerts: AlertEvent[];
  maxAlerts?: number;
}



export interface VideoCaptureProps {
  onDetection: (event: DetectionEvent) => void;
  isActive: boolean;
  onVideoReady?: (blob: Blob) => void;
  showVideo?: boolean;
  enablePeerConnection?: boolean;
  roomId?: string;
}


export interface DashboardStats {
  totalInterviews: number;
  todayInterviews: number;
  avgIntegrityScore: number;
  distribution: {
    pass: number;
    review: number;
    fail: number;
  };
  topViolations: Array<{ type: string; count: number }>;
}

export interface Interview {
  _id: string;
  candidateName: string;
  startTime: string;
  duration: number;
  integrityScore: number;
  hasVideo: boolean;
  totalEvents: number;
  recommendation: 'PASS' | 'REVIEW' | 'FAIL';
  violationTypes: string[];
}

export interface VideoPlayerProps {
  videoUrl: string;
  events: any[];
  duration: number;
}

export interface UseDetectionProps {
  videoElement: HTMLVideoElement | null;
  onDetection: (event: DetectionEvent) => void;
  isActive: boolean;
  interval?: number;
}