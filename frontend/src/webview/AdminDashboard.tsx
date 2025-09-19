import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import type { DashboardStats, Interview } from '../types';



export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    loadDashboardData();
  }, [currentPage, searchTerm, scoreFilter]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const statsData = await adminApi.getDashboardStats();
      setStats(statsData);

      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (scoreFilter === 'pass') { params.minScore = 80; }
      if (scoreFilter === 'review') { params.minScore = 60; params.maxScore = 79; }
      if (scoreFilter === 'fail') { params.maxScore = 59; }

      const interviewsData = await adminApi.getAllInterviews(params);
      setInterviews(interviewsData.interviews);
      setPagination(interviewsData.pagination);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'PASS': return '#28a745';
      case 'REVIEW': return '#ffc107';
      case 'FAIL': return '#dc3545';
      default: return '#6c757d';
    }
  };


const formatViolationTypes = (types: string[]) => {
  const typeLabels: Record<string, string> = {
    'FOCUS_LOST': 'Focus',
    'FACE_ABSENT': 'Absent',
    'MULTIPLE_FACES': 'Multiple',
    'PHONE_DETECTED': 'Phone',
    'BOOK_DETECTED': 'Books',
    'DEVICE_DETECTED': 'Device'
  };
  
  return types.map((type: string) => typeLabels[type] || type).join(', ');
};


  if (isLoading && !stats) {
    return (
      <div className="admin-loading">
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-gray-50 p-4">
  <header className="bg-white rounded-lg shadow mb-6 p-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Interview Admin Dashboard</h1>
      <button 
        onClick={() => navigate('/')} 
        className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
      >
        Create New Interview
      </button>
    </div>
  </header>

  {stats && (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Interviews</h3>
          <div className="text-3xl font-bold text-gray-800">{stats.totalInterviews}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Today's Interviews</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.todayInterviews}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Average Score</h3>
          <div className="text-3xl font-bold text-green-600">{stats.avgIntegrityScore}%</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Pass Rate</h3>
          <div className="text-3xl font-bold text-purple-600">
            {stats.totalInterviews > 0 
              ? Math.round((stats.distribution.pass / (stats.distribution.pass + stats.distribution.review + stats.distribution.fail)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Interview Distribution</h4>
          <div className="flex items-end justify-around h-32">
            <div className="flex flex-col items-center">
              <div 
                className="bg-green-500 w-16 rounded-t" 
                style={{ height: `${Math.max(stats.distribution.pass * 2, 10)}px` }}
              ></div>
              <span className="text-sm text-gray-600 mt-2">Pass ({stats.distribution.pass})</span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="bg-yellow-500 w-16 rounded-t" 
                style={{ height: `${Math.max(stats.distribution.review * 2, 10)}px` }}
              ></div>
              <span className="text-sm text-gray-600 mt-2">Review ({stats.distribution.review})</span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="bg-red-500 w-16 rounded-t" 
                style={{ height: `${Math.max(stats.distribution.fail * 2, 10)}px` }}
              ></div>
              <span className="text-sm text-gray-600 mt-2">Fail ({stats.distribution.fail})</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Most Common Violations</h4>
          <div className="space-y-3">
            {stats.topViolations.map((violation, index) => (
              <div key={violation.type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded mr-3">
                    #{index + 1}
                  </span>
                  <span className="text-gray-700 font-medium">
                    {violation.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                  {violation.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )}

  <div className="bg-white p-4 rounded-lg shadow mb-6">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by candidate name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="sm:w-48">
        <select 
          value={scoreFilter} 
          onChange={(e) => setScoreFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Scores</option>
          <option value="pass">Pass (80-100)</option>
          <option value="review">Review (60-79)</option>
          <option value="fail">Fail (0-59)</option>
        </select>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">Recent Interviews</h3>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {interviews.map((interview) => (
            <tr key={interview._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-800">{interview.candidateName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div>{new Date(interview.startTime).toLocaleDateString()}</div>
                <div className="text-gray-400">{new Date(interview.startTime).toLocaleTimeString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {interview.duration} min
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span 
                  className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                  style={{ backgroundColor: getRecommendationColor(interview.recommendation) }}
                >
                  {interview.integrityScore}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {interview.totalEvents}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs text-gray-500 max-w-32">
                  {formatViolationTypes(interview.violationTypes)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-lg">
                  {interview.hasVideo ? '✅' : '❌'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span 
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    interview.recommendation.toLowerCase() === 'pass' 
                      ? 'bg-green-100 text-green-800'
                      : interview.recommendation.toLowerCase() === 'review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {interview.recommendation}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button 
                  onClick={() => navigate(`/admin/interview/${interview._id}`)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded font-medium"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="px-6 py-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {pagination.pages}
        </span>
        <button 
          disabled={currentPage === pagination.pages}
          onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</div>

  );
};