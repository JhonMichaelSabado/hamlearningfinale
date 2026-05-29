import React, { useState } from 'react';
import { classAPI } from '../services/api';
import './JoinClass.css';

const JoinClass = ({ onClassJoined }) => {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const sanitizeClassCode = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

  const handleJoin = async () => {
    const normalizedCode = sanitizeClassCode(classCode);

    if (!normalizedCode) {
      setMessage({ text: 'Please enter a class code', type: 'error' });
      return;
    }

    if (!/^[A-Z0-9]{5,8}$/.test(normalizedCode)) {
      setMessage({ text: 'Class code must be 5-8 letters or numbers only.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      console.log(`🔍 Attempting to join class with code: ${normalizedCode}`);
      const response = await classAPI.joinClass(normalizedCode);
      console.log('✅ Successfully joined class:', response.data);
      console.log('📅 Class schedules should now appear on your calendar!');
      
      const className = response.data.class?.className || 'the class';
      setMessage({ 
        text: `🎉 Successfully joined ${className}! Check your sidebar.`, 
        type: 'success' 
      });
      setClassCode('');
      
      // Notify parent component to refresh the enrolled classes
      if (onClassJoined) {
        console.log('🔄 Refreshing enrolled classes...');
        onClassJoined();
      }
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('❌ Error joining class:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to join class';
      if (error.response?.status === 404) {
        errorMessage = '❌ Invalid class code. Please check and try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || '⚠️ You are already enrolled in this class.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin();
    }
  };

  const handleClassCodeChange = (event) => {
    setClassCode(sanitizeClassCode(event.target.value));
  };

  const handleClassCodeBeforeInput = (event) => {
    const nextValue = sanitizeClassCode(event.data);
    if (event.inputType === 'insertText' && event.data && !nextValue) {
      event.preventDefault();
      return;
    }

    const currentValue = sanitizeClassCode(classCode);
    const selectionStart = event.target.selectionStart ?? currentValue.length;
    const selectionEnd = event.target.selectionEnd ?? currentValue.length;
    const prospective = sanitizeClassCode(
      currentValue.slice(0, selectionStart) + (event.data || '') + currentValue.slice(selectionEnd)
    );

    if (prospective.length > 8) {
      event.preventDefault();
    }
  };

  const handleClassCodePaste = (event) => {
    const pastedText = event.clipboardData.getData('text');
    const sanitized = sanitizeClassCode(pastedText);
    if (!sanitized) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setClassCode((current) => sanitizeClassCode(current + sanitized));
  };

  return (
    <div className="join-class-container">
      <div className="join-class-content">
        <div className="hamster-message">
          <div className="hamster-character">
            <img src="/images/hamster-teacher.png" alt="Hamster Teacher" />
          </div>
          <div className="speech-bubble">
            <span className="bubble-text">Yo, go holla at ya teacher</span>
            <span className="bubble-text">for that <span className="highlight">class code</span>.</span>
          </div>
        </div>

        <div className="join-section">
          <h1 className="join-title">JOIN A CLASS!</h1>
          <p className="enter-code-text">Enter Class Code:</p>
          
          <div className="class-code-box">
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
            <input
              type="text"
              className="class-code-input"
              value={classCode}
              onChange={handleClassCodeChange}
              onBeforeInput={handleClassCodeBeforeInput}
              onPaste={handleClassCodePaste}
              onKeyPress={handleKeyPress}
              placeholder="N144A"
              maxLength={8}
              minLength={5}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="characters"
              pattern="[A-Za-z0-9]{5,8}"
              data-input-rule="class-code"
              disabled={loading}
            />
          </div>

          <div className="join-instructions">
            <p>To sign in with a class code</p>
            <ul>
              <li>Use an authorised account</li>
              <li>Use a class code with 5-8 letters or numbers, and no spaces or symbols</li>
            </ul>
          </div>

          <button className="btn-join" onClick={handleJoin} disabled={loading}>
            {loading ? 'JOINING...' : 'JOIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;
