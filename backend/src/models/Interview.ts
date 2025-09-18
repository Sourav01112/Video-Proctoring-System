import mongoose, { Document, Schema } from 'mongoose';

interface DetectionEvent {
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

interface Interview {
  candidateName: string;
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed";
  videoUrl?: string;
  events: DetectionEvent[];
  integrityScore?: number;
}

interface InterviewDoc extends Interview, Document {}

const DetectionEventSchema = new Schema<DetectionEvent>({
  eventType: {
    type: String,
    enum: ["FOCUS_LOST", "FACE_ABSENT", "MULTIPLE_FACES", "PHONE_DETECTED", "BOOK_DETECTED", "DEVICE_DETECTED"],
    required: true
  },
  timestamp: { type: Date, required: true },
  duration: { type: Number },
  confidence: { type: Number, required: true },
  metadata: {
    objectType: String,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }
});

const InterviewSchema = new Schema<InterviewDoc>({
  candidateName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ["active", "completed"], 
    default: "active" 
  },
  videoUrl: { type: String },
  events: [DetectionEventSchema],
  integrityScore: { type: Number }
}, {
  timestamps: true
});

export default mongoose.model<InterviewDoc>('Interview', InterviewSchema);