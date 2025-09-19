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
export interface Interview {
    _id?: string;
    candidateName: string;
    startTime: Date;
    endTime?: Date;
    status: "active" | "completed";
    videoUrl?: string;
    events: DetectionEvent[];
    integrityScore?: number;
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
//# sourceMappingURL=types.d.ts.map