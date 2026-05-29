import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const CompleteProfile = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    major: '',
    academicYear: '',
    targetGPA: '',
    department: '',
    subjects: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { completeProfile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await completeProfile({ role, ...formData });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="brand-header">
        <img src="/images/header-banner.png" alt="HamLearning" className="auth-logo" />
        <p className="tagline">Your Academic Success Companion</p>
      </div>

      <div className="auth-card">
        <div className="welcome-section">
          <h2>Complete Your Profile</h2>
          <p>Tell us more about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="role-section">
            <label className="section-label">I am a...</label>
            <div className="role-selector">
              <div 
                className={`role-option ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="role-icon">🎓</span>
                <span>Student</span>
              </div>
              <div 
                className={`role-option ${role === 'teacher' ? 'selected' : ''}`}
                onClick={() => setRole('teacher')}
              >
                <span className="role-icon">📚</span>
                <span>Teacher</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Major</label>
            <input
              type="text"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
              required
            />
          </div>

          {role === 'student' && (
            <>
              <div className="form-group">
                <label>Academic Year</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select year</option>
                  <option value="1st year">1st year</option>
                  <option value="2nd year">2nd year</option>
                  <option value="3rd year">3rd year</option>
                  <option value="4th year">4th year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target GPA</label>
                <select
                  name="targetGPA"
                  value={formData.targetGPA}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select target GPA</option>
                  <option value="1.00">1.00 (Highest)</option>
                  <option value="1.25">1.25</option>
                  <option value="1.50">1.50</option>
                  <option value="1.75">1.75</option>
                  <option value="2.00">2.00</option>
                  <option value="2.25">2.25</option>
                  <option value="2.50">2.50</option>
                  <option value="2.75">2.75</option>
                  <option value="3.00">3.00</option>
                </select>
              </div>
            </>
          )}

          {role === 'teacher' && (
            <>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder=""
                  required
                />
              </div>

              <div className="form-group">
                <label>Subjects</label>
                <input
                  type="text"
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder=""
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
