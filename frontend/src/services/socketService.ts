
import { io, Socket } from 'socket.io-client';

class SocketService {
  public socket: Socket | null = null;
  private serverUrl: string = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

  connect(): void {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
         path: "/tutedude/socket.io/",
        transports: ['websocket', 'polling'],
         upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, role: 'candidate' | 'interviewer'): void {
    if (this.socket) {
      console.log(`Joining room ${roomId} as ${role}`);
      this.socket.emit('join-room', { roomId, role });
    }
  }

  sendDetectionEvent(roomId: string, eventType: string, timestamp: Date, confidence: number): void {
    if (this.socket) {
      console.log(`Sending detection event: ${eventType} in room ${roomId}`);
      this.socket.emit('detection-event', {
        roomId,
        eventType,
        timestamp,
        confidence
      });
    }
  }

  onCandidateAlert(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('candidate-alert', callback);
    }
  }

  endInterview(roomId: string): void {
    if (this.socket) {
      this.socket.emit('end-interview', { roomId });
    }
  }

  onInterviewEnded(callback: () => void): void {
    if (this.socket) {
      this.socket.on('interview-ended', callback);
    }
  }

} 


export const socketService = new SocketService();
