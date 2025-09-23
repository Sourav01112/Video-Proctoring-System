# Video Proctoring System

A full-stack AI-powered video proctoring solution for online interviews and assessments, built with React, Node.js, and computer vision technologies.

## Features

- **Real-time AI Detection**: Monitors focus, face presence, and suspicious objects using TensorFlow.js and COCO-SSD configured on client side
- **Live Video Recording**: Automatic video capture and storage for interview sessions
- **Admin Dashboard**: Comprehensive monitoring and reporting interface
- **PDF Report Generation**: Professional academic integrity reports
- **Multi-role System**: Separate interfaces for candidates, interviewers, and administrators

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- TensorFlow.js for AI detection
- Socket.io for real-time communication

**Backend:**
- Node.js with Express
- MongoDB for data storage
- Socket.io for WebSocket connections
- Multer for file uploads

## Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/Sourav01112/Video-Proctoring-System.git
cd video-proctoring-system
```

2. Build the application:
```bash
docker-compose build
```

3. Run the application:
```bash
docker-compose up
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### Live Demo

🚀 **Live project deployed on Oracle Cloud Infrastructure**

Access the production deployment at: `https://submission.souravcodes.in/tutedude/`

*Note: Live demo showcases full functionality including real-time AI detection and video recording capabilities.*

## Usage

1. **Create Interview Room**: Access the admin panel to create new interview sessions
2. **Candidate Access**: Share the generated candidate link for interview participation  
3. **Monitor Interview**: Use the interviewer dashboard for real-time monitoring
4. **Review Results**: Generate detailed PDF reports post-interview

## Detection Capabilities

- Focus loss detection (>5 seconds looking away)
- Face absence detection (>10 seconds)
- Multiple faces in frame
- Unauthorized objects (phones, books, devices)
- Real-time confidence scoring

## Project Structure

```
├── frontend/          # React application
├── backend/           # Node.js API server
├── docker-compose.yml # Container orchestration
└── README.md
```

## Development

For development mode, you can run services individually:

```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev
```

## Assignment Implementation

This project demonstrates:
- Full-stack development skills
- Real-time AI integration
- Modern React patterns with hooks
- RESTful API design
- Database modeling
- Docker containerization
- Professional UI/UX design

Built as part of a technical assessment to showcase software engineering capabilities.