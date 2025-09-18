import { Request, Response } from 'express';
import Interview from '../models/Interview';
import { DetectionEvent, ReportResponse } from '../../../shared/src/types';
import path from 'path';
import fs from 'fs';
import { calculateIntegrityScore, generateSummary } from '../utils/helper';

export const startInterview = async (req: Request, res: Response) => {
  try {
    const { candidateName } = req.body;
    console.log("candiateNAme")

    if (!candidateName) {
      return res.status(400).json({ error: 'Candidate name is required' });
    }

    const interview = new Interview({
      candidateName,
      startTime: new Date(),
      status: 'active',
      events: []
    });

    await interview.save();

    res.status(201).json({
      interviewId: interview._id,
      candidateName: interview.candidateName,
      startTime: interview.startTime,
      status: interview.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const getInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const duration = interview.endTime 
      ? Math.floor((interview.endTime.getTime() - interview.startTime.getTime()) / 1000)
      : Math.floor((new Date().getTime() - interview.startTime.getTime()) / 1000);

      console.log("duration::", duration)
    res.json({
      interviewId: interview._id,
      candidateName: interview.candidateName,
      startTime: interview.startTime,
      endTime: interview.endTime,
      duration,
      status: interview.status
    });
  } catch (error:any) {
    console.log({error})
    res.status(500).json({ error: 'Failed' });
  }
};

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventData: DetectionEvent = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.events.push(eventData);
    await interview.save();

    res.json({
      success: true,
      // eventId: interview.events[interview.events.length - 1]._id
      eventId: interview.events[interview.events.length - 1]

    });
   } catch (error:any) {
    console.log({error})
    res.status(500).json({ error: 'Failed to log event' });
  }
};

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.videoUrl = req.file.path;
    interview.status = 'completed';
    interview.endTime = new Date();
    
    interview.integrityScore = calculateIntegrityScore(interview.events);
    
    await interview.save();

    res.json({
      success: true,
      videoId: interview._id,
      fileSize: req.file.size,
      duration: 0
    });
    } catch (error:any) {
    console.log({error})
    res.status(500).json({ error: 'Failed to upload video' });
  }
};

export const getVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);

    if (!interview || !interview.videoUrl) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.resolve(interview.videoUrl);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/webm',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/webm',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
   } catch (error:any) {
    console.log({error})
    res.status(500).json({ error: 'Failed to get video' });
  }
};

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const duration = interview.endTime 
      ? (interview.endTime.getTime() - interview.startTime.getTime()) / 1000 / 60
      : (new Date().getTime() - interview.startTime.getTime()) / 1000 / 60;

    const events = interview.events;
    
    const focusLostCount = events.filter(e => e.eventType === 'FOCUS_LOST').length;
    const faceAbsentCount = events.filter(e => e.eventType === 'FACE_ABSENT').length;
    const multipleFacesCount = events.filter(e => e.eventType === 'MULTIPLE_FACES').length;
    const phoneDetected = events.filter(e => e.eventType === 'PHONE_DETECTED').length;
    const booksDetected = events.filter(e => e.eventType === 'BOOK_DETECTED').length;
    const devicesDetected = events.filter(e => e.eventType === 'DEVICE_DETECTED').length;

    const totalFocusLostDuration = events
      .filter(e => e.eventType === 'FOCUS_LOST')
      .reduce((total, event) => total + (event.duration || 0), 0);

    const integrityScore = interview.integrityScore || calculateIntegrityScore(events);
    
    let recommendation: "PASS" | "REVIEW" | "FAIL";
    if (integrityScore >= 80) recommendation = "PASS";
    else if (integrityScore >= 60) recommendation = "REVIEW";
    else recommendation = "FAIL";

    const report: ReportResponse = {
      candidateName: interview.candidateName,
      interviewDuration: Math.round(duration),
      startTime: interview.startTime,
      endTime: interview.endTime || new Date(),
      focusLostCount,
      totalFocusLostDuration,
      faceAbsentCount,
      multipleFacesCount,
      suspiciousEvents: {
        phoneDetected,
        booksDetected,
        devicesDetected
      },
      integrityScore,
      events,
      summary: generateSummary(events, integrityScore),
      recommendation
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

