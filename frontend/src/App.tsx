import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './webview/Dashboard'
import { CandidateView } from './webview/CandidateView'
import { AdminDashboard } from './webview/AdminDashboard'
import { ReviewSession } from './webview/ReviewSession'
import { InterviewerView } from './webview/InterviewerView'
import './App.css'

console.log("import.meta.env.VITE_API_UR", import.meta.env.VITE_API_URL)

function App() {

  return (
    <Router  basename="/tutedude">
      <div className="App">
        <Routes>
         <Route path="/" element={<Dashboard />} />
          <Route path="/candidate/:roomId" element={<CandidateView />} />
          <Route path="/interviewer/:roomId" element={<InterviewerView />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/interview/:id" element={<ReviewSession />} />
          <Route path="*" element={<NotFoundPage/>} />
        </Routes>
      </div>
    </Router>
  )
}

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <div className="not-found-links">
          <a href="/" className="home-link">
            Go to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default App