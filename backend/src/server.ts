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
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proctoring';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Video Proctoring API'
  });
});

// UPDATED: Socket.io for room-based real-time communication + WebRTC signaling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room as candidate or interviewer
  socket.on('join-room', (data: { roomId: string, role: 'candidate' | 'interviewer' }) => {
    const { roomId, role } = data;
    const roomName = `${roomId}-${role}`;
    socket.join(roomName);
    socket.join(roomId); // Also join general room for WebRTC signaling
    console.log(`${socket.id} joined room ${roomName} as ${role}`);
    
    // Notify other users in the room
    socket.to(roomId).emit('user-joined', { role, socketId: socket.id });
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', { offer: data.offer, from: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', { answer: data.answer, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  // Candidate sends detection event to interviewer
  socket.on('detection-event', (data) => {
    const { roomId, eventType, timestamp, confidence } = data;
    console.log(`Detection event in room ${roomId}:`, eventType);
    
    // Send alert to interviewer in the same room
    socket.to(`${roomId}-interviewer`).emit('candidate-alert', {
      type: eventType,
      timestamp: timestamp,
      confidence: confidence,
      message: getEventMessage(eventType)
    });
  });

  // Interviewer ends interview
  socket.on('end-interview', (data) => {
    const { roomId } = data;
    
    // Notify candidate that interview ended
    socket.to(`${roomId}-candidate`).emit('interview-ended');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function for event messages
const getEventMessage = (eventType: string): string => {
  switch(eventType) {
    case 'FOCUS_LOST': return 'Candidate looking away from screen';
    case 'FACE_ABSENT': return 'No face detected in frame';
    case 'MULTIPLE_FACES': return 'Multiple faces detected';
    case 'PHONE_DETECTED': return 'Mobile phone detected';
    case 'BOOK_DETECTED': return 'Books/notes detected';
    case 'DEVICE_DETECTED': return 'Electronic device detected';
    default: return 'Suspicious activity detected';
  }
};

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});



// Database connection
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


// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import path from 'path';
// import fs from 'fs';
// import routes from './routes';

// dotenv.config();

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = process.env.PORT || 8000;
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proctoring';

// const uploadsDir = path.join(__dirname, '../uploads/videos');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// app.use(helmet());
// app.use(morgan('combined'));
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:5173",
//   credentials: true
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// app.use('/api', routes);

// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     service: 'Video Proctoring Server'
//   });
// });

// io.on('connection', (socket) => {
//   console.log('Client connected:', socket.id);

//   socket.on('join-room', (data: { roomId: string, role: 'candidate' | 'interviewer' }) => {
//     const { roomId, role } = data;
//     const roomName = `${roomId}-${role}`;
//     socket.join(roomName);
//     console.log(`${socket.id} joined ${roomName} as ${role}`);
//   });

//   socket.on('detection-event', (data) => {
//     const { roomId, eventType, timestamp, confidence } = data;
    
//     socket.to(`${roomId}-interviewer`).emit('candidate-alert', {
//       type: eventType,
//       timestamp: timestamp,
//       confidence: confidence,
//       message: getEventMessage(eventType)
//     });
//   });

//   socket.on('end-interview', (data) => {
//     const { roomId } = data;
    
//     socket.to(`${roomId}-candidate`).emit('interview-ended');
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// const getEventMessage = (eventType: string): string => {
//   switch(eventType) {
//     case 'FOCUS_LOST': return 'Candidate looking away from screen';
//     case 'FACE_ABSENT': return 'No face detected in frame';
//     case 'MULTIPLE_FACES': return 'Multiple faces detected';
//     case 'PHONE_DETECTED': return 'Mobile phone detected';
//     case 'BOOK_DETECTED': return 'Books/notes detected';
//     case 'DEVICE_DETECTED': return 'Electronic device detected';
//     default: return 'Suspicious activity detected';
//   }
// };

// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });


// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log('Connected to MongoDB');
//     server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//       console.log(`Health check: http://localhost:${PORT}/api/health`);
//     });
//   })
//   .catch((error) => {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   });

// export default app;