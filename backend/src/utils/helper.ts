
import { DetectionEvent } from "@shared/types";

export const calculateIntegrityScore = (events: DetectionEvent[]): number => {
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

export const generateSummary = (events: DetectionEvent[], score: number): string => {
  const totalEvents = events.length;
  if (totalEvents === 0) {
    return "No suspicious activities detected. Excellent interview conduct.";
  }
  
  if (score >= 80) {
    return `Minor issues detected (${totalEvents} events). Overall good interview conduct.`;
  } else if (score >= 60) {
    return `Moderate concerns identified (${totalEvents} events). Requires review.`;
  } else {
    return `Significant violations detected (${totalEvents} events). Interview integrity compromised.`;
  }
};