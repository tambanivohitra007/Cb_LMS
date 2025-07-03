import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACHIEVED', label: 'Achieved' },
  { value: 'MASTERED', label: 'Mastered' },
];

function AssignmentSubmissionsReview() {
  const { assignmentId } = useParams();
  const { apiClient } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await apiClient.get(`/assignments/${assignmentId}/submissions`);
        setSubmissions(res.data || []);
      } catch (err) {
        setError('Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [assignmentId, apiClient]);

  const handleStatusChange = async (submissionId, status) => {
    setUpdating(prev => ({ ...prev, [submissionId]: true }));
    try {
      await apiClient.put(`/submissions/${submissionId}/status`, { status });
      // Optionally, send feedback if present
      if (feedback[submissionId]) {
        await apiClient.post(`/submissions/${submissionId}/feedback`, { feedback: feedback[submissionId] });
      }
      // Refresh
      const res = await apiClient.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data || []);
      setFeedback(prev => ({ ...prev, [submissionId]: '' }));
    } catch (err) {
      alert('Failed to update submission.');
    } finally {
      setUpdating(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Submissions</h1>
      {submissions.length === 0 ? (
        <p className="text-gray-500">No submissions yet.</p>
      ) : (
        <div className="space-y-8">
          {submissions.map(sub => (
            <div key={sub.id} className="border-b pb-6">
              <div className="flex items-center gap-4 mb-2">
                <img src={sub.student.photo || 'https://i.pravatar.cc/100'} alt="student" className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold">{sub.student.name}</div>
                  <div className="text-xs text-gray-500">{sub.student.email}</div>
                </div>
              </div>
              <div className="mb-2">
                <strong>Submitted at:</strong> {new Date(sub.submitted_at).toLocaleString()}
              </div>
              <div className="mb-2">
                <strong>Submission:</strong>{' '}
                {sub.content && sub.content.startsWith('/uploads/') ? (
                  <a href={sub.content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Download File</a>
                ) : (
                  <span className="whitespace-pre-line">{sub.content}</span>
                )}
              </div>
              <div className="mb-2">
                <strong>Status:</strong>{' '}
                <select
                  value={sub.status}
                  onChange={e => handleStatusChange(sub.id, e.target.value)}
                  disabled={updating[sub.id]}
                  className="border rounded px-2 py-1"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <strong>Feedback:</strong>
                <textarea
                  className="w-full border rounded p-2 mt-1"
                  rows={2}
                  value={feedback[sub.id] ?? sub.feedback ?? ''}
                  onChange={e => setFeedback(prev => ({ ...prev, [sub.id]: e.target.value }))}
                  placeholder="Leave feedback (optional)"
                  disabled={updating[sub.id]}
                />
                <button
                  onClick={() => handleStatusChange(sub.id, sub.status)}
                  disabled={updating[sub.id]}
                  className="mt-2 bg-indigo-500 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-600 disabled:opacity-50"
                >
                  {updating[sub.id] ? 'Saving...' : 'Save Feedback/Status'}
                </button>
              </div>
              {sub.reviewed_at && (
                <div className="text-xs text-gray-400">Last reviewed: {new Date(sub.reviewed_at).toLocaleString()}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignmentSubmissionsReview;
