import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  startInterview, 
  getInterview, 
  logEvent, 
  uploadVideo, 
  getVideo, 
  generateReport 
} from '../controllers/interview.controller';

import {
  createRoom,
  getRoomInfo,
  joinRoom,
  endInterview
} from '../controllers/room.controller';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `interview-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

router.post('/rooms', createRoom);
router.get('/rooms/:roomId', getRoomInfo);
router.post('/rooms/:roomId/join', joinRoom);
router.post('/rooms/:roomId/end', endInterview);
router.post('/interviews', startInterview);
router.get('/interviews/:id', getInterview);
router.post('/interviews/:id/events', logEvent);
router.post('/interviews/:id/video', upload.single('video'), uploadVideo);
router.get('/interviews/:id/video', getVideo);
router.get('/interviews/:id/report', generateReport);

export default router;
