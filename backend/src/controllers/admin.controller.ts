import { Request, Response } from 'express';
import Interview from '../models/Interview';
import Room from '../models/Room';

export const getAllInterviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, dateFrom, dateTo, minScore, maxScore } = req.query;
    
    const filter: any = { status: 'completed' };
    
    if (search) {
      filter.candidateName = { $regex: search, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom as string);
      if (dateTo) filter.startTime.$lte = new Date(dateTo as string);
    }
    
    if (minScore || maxScore) {
      filter.integrityScore = {};
      if (minScore) filter.integrityScore.$gte = parseInt(minScore as string);
      if (maxScore) filter.integrityScore.$lte = parseInt(maxScore as string);
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const interviews = await Interview.find(filter)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('candidateName startTime endTime integrityScore videoUrl events');
    
    const total = await Interview.countDocuments(filter);
    
    const interviewsWithStats = interviews.map(interview => ({
      _id: interview._id,
      candidateName: interview.candidateName,
      startTime: interview.startTime,
      endTime: interview.endTime,
      duration: interview.endTime 
        ? Math.floor((interview.endTime.getTime() - interview.startTime.getTime()) / 60000) 
        : 0,
      integrityScore: interview.integrityScore || 0,
      hasVideo: !!interview.videoUrl,
      totalEvents: interview.events.length,
      violationTypes: [...new Set(interview.events.map(e => e.eventType))],
      recommendation: interview.integrityScore! >= 80 ? 'PASS' : 
                     interview.integrityScore! >= 60 ? 'REVIEW' : 'FAIL'
    }));
    
    res.json({
      interviews: interviewsWithStats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalInterviews = await Interview.countDocuments({ status: 'completed' });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayInterviews = await Interview.countDocuments({
      status: 'completed',
      startTime: { $gte: todayStart }
    });
    
    const interviewsWithScores = await Interview.find({
      status: 'completed',
      integrityScore: { $exists: true }
    }).select('integrityScore events');
    
    const avgIntegrityScore = interviewsWithScores.length > 0
      ? Math.round(interviewsWithScores.reduce((sum, i) => sum + (i.integrityScore || 0), 0) / interviewsWithScores.length)
      : 0;
    
    const passCount = interviewsWithScores.filter(i => (i.integrityScore || 0) >= 80).length;
    const reviewCount = interviewsWithScores.filter(i => {
      const score = i.integrityScore || 0;
      return score >= 60 && score < 80;
    }).length;
    const failCount = interviewsWithScores.filter(i => (i.integrityScore || 0) < 60).length;
    
    const allEvents = interviewsWithScores.flatMap(i => i.events);
    const violationCounts = allEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topViolations = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    res.json({
      totalInterviews,
      todayInterviews,
      avgIntegrityScore,
      distribution: {
        pass: passCount,
        review: reviewCount,
        fail: failCount
      },
      topViolations
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getInterviewForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const room = await Room.findOne({ interviewId: id });
    
    const duration = interview.endTime 
      ? Math.floor((interview.endTime.getTime() - interview.startTime.getTime()) / 60000)
      : 0;
    
    const eventStats = interview.events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = [];
      }
      acc[event.eventType].push({
        timestamp: event.timestamp,
        confidence: event.confidence,
        duration: event.duration,
        metadata: event.metadata
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    res.json({
      _id: interview._id,
      candidateName: interview.candidateName,
      interviewerName: room?.interviewerName || 'Unknown',
      startTime: interview.startTime,
      endTime: interview.endTime,
      duration,
      integrityScore: interview.integrityScore,
      hasVideo: !!interview.videoUrl,
      videoUrl: interview.videoUrl,
      events: interview.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      eventStats,
      recommendation: interview.integrityScore! >= 80 ? 'PASS' : 
                     interview.integrityScore! >= 60 ? 'REVIEW' : 'FAIL',
      summary: generateDetailedSummary(interview.events, interview.integrityScore || 0)
    });
  } catch (error) {
    console.error('Get interview for review error:', error);
    res.status(500).json({ error: 'Failed to fetch interview details' });
  }
};

export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body;
    
    if (!['approved', 'rejected', 'needs_review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const interview = await Interview.findByIdAndUpdate(
      id,
      { 
        reviewStatus: status,
        reviewerNotes,
        reviewedAt: new Date()
      },
      { new: true }
    );
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({ success: true, interview });
  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({ error: 'Failed to update interview status' });
  }
};

const generateDetailedSummary = (events: any[], score: number): string => {
  if (events.length === 0) {
    return "No violations detected during the interview. Candidate maintained proper conduct throughout.";
  }
  
  const eventCounts = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const summaryParts = [];
  
  if (eventCounts.FOCUS_LOST) {
    summaryParts.push(`${eventCounts.FOCUS_LOST} focus loss incident(s)`);
  }
  if (eventCounts.FACE_ABSENT) {
    summaryParts.push(`${eventCounts.FACE_ABSENT} face absence event(s)`);
  }
  if (eventCounts.PHONE_DETECTED) {
    summaryParts.push(`${eventCounts.PHONE_DETECTED} phone detection(s)`);
  }
  if (eventCounts.BOOK_DETECTED) {
    summaryParts.push(`${eventCounts.BOOK_DETECTED} book/notes detection(s)`);
  }
  if (eventCounts.MULTIPLE_FACES) {
    summaryParts.push(`${eventCounts.MULTIPLE_FACES} multiple faces incident(s)`);
  }
  
  const severity = score >= 80 ? "minor" : score >= 60 ? "moderate" : "significant";
  
  return `Interview showed ${severity} integrity concerns with ${summaryParts.join(', ')}. Final integrity score: ${score}/100.`;
};