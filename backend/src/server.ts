import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

import routes from './routes';

dotenv.config();

const app = express();
const server = createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']; 

const io = new Server(server, {
  cors: {
  origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proctoring';

const uploadsDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet());
app.use(morgan('combined'));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Video Proctoring API'
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (data: { roomId: string, role: 'candidate' | 'interviewer' }) => {
    const { roomId, role } = data;
    const roomName = `${roomId}-${role}`;
    socket.join(roomName);
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomName} as ${role}`);

    socket.to(roomId).emit('user-joined', { role, socketId: socket.id });
  });


  socket.on('detection-event', (data) => {
    const { roomId, eventType, timestamp, confidence } = data;
    console.log(`Detection event in room ${roomId}:`, eventType);

    socket.to(`${roomId}-interviewer`).emit('candidate-alert', {
      type: eventType,
      timestamp: timestamp,
      confidence: confidence,
      message: getEventMessage(eventType)
    });
  });

  socket.on('end-interview', (data) => {
    const { roomId } = data;

    socket.to(`${roomId}-candidate`).emit('interview-ended');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const getEventMessage = (eventType: string): string => {
  switch (eventType) {
    case 'FOCUS_LOST': return 'Candidate looking away from screen';
    case 'FACE_ABSENT': return 'No face detected in frame';
    case 'MULTIPLE_FACES': return 'Multiple faces detected';
    case 'PHONE_DETECTED': return 'Mobile phone detected';
    case 'BOOK_DETECTED': return 'Books/notes detected';
    case 'DEVICE_DETECTED': return 'Electronic device detected';
    default: return 'Suspicious activity detected';
  }
};

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});



mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
