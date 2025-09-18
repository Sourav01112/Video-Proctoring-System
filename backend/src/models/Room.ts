import mongoose, { Document, Schema } from 'mongoose';

interface Room extends Document {
    roomId: string;
    candidateName: string;
    interviewerName: string;
    status: 'waiting' | 'active' | 'completed';
    startTime?: Date;
    endTime?: Date;
    interviewId?: mongoose.Types.ObjectId
    createdAt: Date;
}

const RoomSchema = new Schema<Room>({
    roomId: { type: String, required: true, unique: true },
    candidateName: { type: String, required: true },
    interviewerName: { type: String, required: true },
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    startTime: { type: Date },
    endTime: { type: Date },
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview' },
}, {
    timestamps: true
});

export default mongoose.model<Room>('Room', RoomSchema);