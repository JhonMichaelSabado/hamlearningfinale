import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { classAPI, taskAPI, deadlineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IoHomeOutline, IoCalendarOutline, IoTimeOutline, IoStatsChartOutline, IoSchoolOutline, IoCheckboxOutline, IoTimerOutline, IoHeartOutline, IoArchiveOutline, IoSettingsOutline, IoLogOutOutline } from 'react-icons/io5';
import LogoutConfirmModal from './LogoutConfirmModal';
import './StudentSidebar.css';

const StudentSidebar = ({ refreshTrigger }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasTasks, setHasTasks] = useState(false);
  const [hamsterImage, setHamsterImage] = useState('/images/hamster-task.jpg');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [nearestDueText, setNearestDueText] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <IoHomeOutline /> },
    { name: 'Schedules', path: '/dashboard/schedules', icon: <IoCalendarOutline /> },
    { name: 'Deadlines', path: '/dashboard/deadlines', icon: <IoTimeOutline /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <IoStatsChartOutline /> },
    { name: 'Grades', path: '/dashboard/grades', icon: <IoSchoolOutline /> },
    { name: 'Tasks', path: '/dashboard/tasks', icon: <IoCheckboxOutline /> },
    { name: 'Pomodoro', path: '/dashboard/pomodoro', icon: <IoTimerOutline /> },
    { name: 'Wellness', path: '/dashboard/wellness', icon: <IoHeartOutline /> },
    { name: 'Archive', path: '/dashboard/archive', icon: <IoArchiveOutline /> }
  ];

  const fetchEnrolledClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getEnrolledClasses();
      console.log('Enrolled classes response:', response.data);
      const enrolledClasses = response.data.classes || [];
      setClasses(enrolledClasses);
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkTasks = async () => {
    try {
      const [taskRes, deadlineRes] = await Promise.allSettled([taskAPI.getMyTasks(), deadlineAPI.getMyDeadlines()]);

      const tasks = (taskRes.status === 'fulfilled' ? (taskRes.value.data.personalTasks || []) : []);
      setHasTasks(tasks.length > 0);

      // deadlines API may return array or object; try to normalize
      let deadlines = [];
      if (deadlineRes.status === 'fulfilled') {
        const dr = deadlineRes.value.data;
        // if response is object with deadlines property
        if (Array.isArray(dr)) deadlines = dr;
        else if (Array.isArray(dr.deadlines)) deadlines = dr.deadlines;
      }

      // compute upcoming deadlines (not completed and in future)
      const now = new Date();
      const upcoming = deadlines.filter(d => {
        try {
          const due = new Date(d.due_date || d.deadline_date || d.dueDate);
          return due > now && !d.is_completed;
        } catch (e) {
          return false;
        }
      });

      setUpcomingCount(upcoming.length);

      // nearest upcoming
      if (upcoming.length > 0) {
        const nearest = upcoming.reduce((a, b) => {
          const da = new Date(a.due_date || a.deadline_date || a.dueDate);
          const db = new Date(b.due_date || b.deadline_date || b.dueDate);
          return da < db ? a : b;
        });
        const nearestDue = new Date(nearest.due_date || nearest.deadline_date || nearest.dueDate);
        setNearestDueText(getTimeUntilShort(nearestDue));
      } else {
        setNearestDueText('No upcoming');
      }

      updateHamsterImage(tasks, upcoming.length, upcoming.length > 0 ? upcoming.reduce((a,b)=>{const da=new Date(a.due_date||a.deadline_date||a.dueDate);const db=new Date(b.due_date||b.deadline_date||b.dueDate);return da<db?a:b}) : null);
    } catch (error) {
      console.error('Error fetching task status or deadlines:', error);
      setHasTasks(false);
      setHamsterImage('/images/hamster-task.jpg');
      setUpcomingCount(0);
      setNearestDueText('');
    }
  };

  // Get the appropriate hamster image based on task status
  const getTimeUntilShort = (dueDate) => {
    const now = new Date();
    const diff = dueDate - now;
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days}d`; 
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours >= 1) return `${hours}h`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
  };

  const updateHamsterImage = (tasks, upcomingCountArg = 0, nearestObj = null) => {
    if (!tasks || tasks.length === 0) {
      setHamsterImage('/images/hamster-task.jpg'); // Default - no tasks
      return;
    }

    const pendingTasks = tasks.filter(t => !t.is_completed).length;
    
    // Calculate tasks completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(task => 
      task.is_completed && 
      task.completed_at && 
      new Date(task.completed_at) >= oneWeekAgo
    ).length;

    // Priority order incorporating deadlines urgency:
    // 1. If there are many upcoming deadlines -> overwhelmed image
    if (upcomingCountArg > 5) {
      setHamsterImage('/images/hamster-task-overwhelmed.png');
      return;
    }

    // 2. If nearest deadline is very near (within 24 hours)
    if (nearestObj) {
      const nearestDue = new Date(nearestObj.due_date || nearestObj.deadline_date || nearestObj.dueDate);
      const diffHours = (nearestDue - new Date()) / (1000 * 60 * 60);
      if (diffHours <= 0) {
        setHamsterImage('/images/hamster-task-overdue.png');
        return;
      }
      if (diffHours <= 24) {
        setHamsterImage('/images/hamster-task-anxious.png');
        return;
      }
      if (diffHours <= 72) {
        setHamsterImage('/images/hamster-task-soon.png');
        return;
      }
    }

    // 3. If more than 3 pending tasks
    if (pendingTasks > 3) {
      setHamsterImage('/images/hamster-task (have more than 3 tasks).png');
      return;
    }

    // 4. If completed more than 1 task this week
    else if (completedThisWeek > 1) {
      setHamsterImage('/images/hamster-task (done more than 1).jpg');
      return;
    }

    // 5. If completed exactly 1 task this week
    else if (completedThisWeek === 1) {
      setHamsterImage('/images/hamster-task (done 1 task for the week).jpg');
      return;
    }

    // 6. Default - no tasks completed yet
    else {
      setHamsterImage('/images/hamster-task.jpg');
      return;
    }
  };

  useEffect(() => {
    fetchEnrolledClasses();
    checkTasks();

    // Check tasks periodically
    const interval = setInterval(checkTasks, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="student-sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <NavLink
              to={item.path}
              end={index === 0}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
            
            {item.name === 'Tasks' && (
                      <div className="empty-tasks-message">
                        <div className="hamster-image-wrap">
                          <img src={hamsterImage} alt="Hamster task status" className="hamster-no-tasks" />
                          {upcomingCount > 0 && (
                            <div className="hamster-badge">
                              <div className="hamster-badge-count">{upcomingCount}</div>
                              <div className="hamster-badge-text">{nearestDueText}</div>
                            </div>
                          )}
                        </div>
                      </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="subjects-section">
        <h4 className="subjects-title">My Classes</h4>
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="empty-classes">
            <p>No classes yet</p>
          </div>
        ) : (
          <div className="classes-list">
            {classes.slice(0, 3).map((classItem) => (
              <div
                key={classItem.id}
                className="class-item"
                onClick={() => navigate(`/dashboard/class/${classItem.id}`)}
              >
                <div className="class-icon">📚</div>
                <div className="class-info">
                  <div className="class-name">{classItem.className}</div>
                  <div className="class-section">{classItem.section}</div>
                </div>
              </div>
            ))}
            {classes.length > 3 && (
              <div className="view-all">View all ({classes.length})</div>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <NavLink to="/dashboard/profile" className="footer-item">
          <IoSettingsOutline className="footer-icon" />
          <span>Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="footer-item logout-btn">
          <IoLogOutOutline className="footer-icon" />
          <span>Log Out</span>
        </button>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default StudentSidebar;
