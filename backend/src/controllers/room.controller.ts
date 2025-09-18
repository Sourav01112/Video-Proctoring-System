import { Request, Response } from 'express';
import Room from '../models/Room';
import Interview from '../models/Interview';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { candidateName, interviewerName } = req.body;

    if (!candidateName || !interviewerName) {
      return res.status(400).json({ 
        error: 'Field required' 
      });
    }

    const roomId = uuidv4().substring(0, 4);

    const room = new Room({
      roomId,
      candidateName,
      interviewerName,
      status: 'waiting'
    });

    await room.save();

    res.status(201).json({
      roomId: room.roomId,
      candidateName: room.candidateName,
      interviewerName: room.interviewerName,
      status: room.status,
      candidateLink: `${process.env.FRONTEND_URL}/candidate/${roomId}`,
      interviewerLink: `${process.env.FRONTEND_URL}/interviewer/${roomId}`
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const getRoomInfo = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({
      roomId: room.roomId,
      candidateName: room.candidateName,
      interviewerName: room.interviewerName,
      status: room.status,
      startTime: room.startTime,
      endTime: room.endTime,
      interviewId: room.interviewId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    console.log("roomId>>", roomId)
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'not found' });
    }
    if (room.status === 'completed') {
      return res.status(400).json({ error: 'already ended' });
    }
    if (room.status === 'waiting') {
      const interview = new Interview({
        candidateName: room.candidateName,
        startTime: new Date(),
        status: 'active',
        events: []
      });
      await interview.save();
      room.status = 'active';
      room.startTime = new Date();
      room.interviewId = interview._id as mongoose.Types.ObjectId;
      await room.save();
    }

    res.json({
      roomId: room.roomId,
      candidateName: room.candidateName,
      status: room.status,
      interviewId: room.interviewId
    });
  } catch (error) {
    console.error('>>>>:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const endInterview = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    console.log("ytess",roomId)

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'not found' });
    }

    if (room.interviewId) {
      const interview = await Interview.findById(room.interviewId);
      if (interview) {
        interview.status = 'completed';
        interview.endTime = new Date();
        interview.integrityScore = calculateIntegrityScore(interview.events);
        await interview.save();
      }
    }
    room.status = 'completed';
    room.endTime = new Date();
    await room.save();
    res.json({
      success: true,
      roomId: room.roomId,
      interviewId: room.interviewId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

const calculateIntegrityScore = (events: any[]): number => {
  let score = 100;
  
  events.forEach(event => {
    switch(event.eventType) {
      case 'FOCUS_LOST': score -= 5; break;
      case 'FACE_ABSENT': score -= 10; break;
      case 'MULTIPLE_FACES': score -= 15; break;
      case 'PHONE_DETECTED': score -= 20; break;
      case 'BOOK_DETECTED': score -= 15; break;
      case 'DEVICE_DETECTED': score -= 20; break;
    }
  });
  
  return Math.max(0, score);
};
