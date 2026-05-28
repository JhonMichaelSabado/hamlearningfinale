import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  IoGridOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoSwapHorizontalOutline,
  IoCheckmarkCircleOutline,
  IoPowerOutline,
  IoAddOutline,
  IoPencilOutline,
  IoCalendarOutline,
  IoStatsChartOutline
} from 'react-icons/io5';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LogoutConfirmModal from './LogoutConfirmModal';
import './AdminDashboard.css';

const navItems = [
  { to: '/admin-dashboard', label: 'Dashboard Overview', icon: IoGridOutline, end: true },
  { to: '/admin-dashboard/users', label: 'User Management', icon: IoPeopleOutline },
  { to: '/admin-dashboard/academic', label: 'Academic Setup', icon: IoSchoolOutline },
  { to: '/admin-dashboard/settings', label: 'System Settings', icon: IoSettingsOutline }
];

const formatCount = (value) => new Intl.NumberFormat().format(value || 0);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">
            <IoShieldCheckmarkOutline />
          </div>
          <div>
            <div className="admin-brand-title">Admin Console</div>
            <div className="admin-brand-subtitle">{user?.name || 'Administrator'}</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
                <Icon className="admin-nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-note">Restricted to admin role only.</div>
          <button className="admin-logout-button" onClick={() => setShowLogoutModal(true)} type="button">
            <IoPowerOutline className="admin-logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-kicker">Hammy LMS</div>
            <h1>Admin Dashboard</h1>
            <p>Manage people, academic structure, and platform settings from one place.</p>
          </div>
          <div className="admin-role-chip">
            <IoShieldCheckmarkOutline />
            <span>{user?.role || 'admin'}</span>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export const AdminOverview = () => {
  const [summary, setSummary] = useState({});
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        const [summaryResponse, usersResponse] = await Promise.all([
          adminAPI.getSummary(),
          adminAPI.getUsers({ role: 'teacher' })
        ]);

        if (!active) return;

        setSummary(summaryResponse.data.counts || {});
        setPendingTeachers((usersResponse.data.users || []).filter((user) => !user.teacherVerified));
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Unable to load summary');
      } finally {
        if (active) {
          setLoading(false);
          setTeachersLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, []);

  const handleQuickApprove = async (teacherId) => {
    setApprovingId(teacherId);
    setError('');
    setMessage('');

    try {
      const response = await adminAPI.verifyTeacher(teacherId, true);
      const updatedTeacher = response.data.user;

      setPendingTeachers((current) => current.filter((teacher) => teacher.id !== teacherId));
      setSummary((current) => ({
        ...current,
        pendingTeachers: Math.max((current.pendingTeachers || 0) - 1, 0)
      }));
      setMessage(`${updatedTeacher?.name || 'Teacher'} approved successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to approve teacher');
    } finally {
      setApprovingId(null);
    }
  };

  const cards = [
    { label: 'Students', value: summary.students, icon: IoPeopleOutline },
    { label: 'Teachers', value: summary.teachers, icon: IoSchoolOutline },
    { label: 'Admins', value: summary.admins, icon: IoShieldCheckmarkOutline },
    { label: 'Active Accounts', value: summary.activeAccounts, icon: IoStatsChartOutline },
    { label: 'Pending Teacher Reviews', value: summary.pendingTeachers, icon: IoCheckmarkCircleOutline },
    { label: 'Majors', value: summary.majors, icon: IoGridOutline },
    { label: 'Semesters', value: summary.semesters, icon: IoCalendarOutline },
    { label: 'Avg Daily Active Time', value: '74m', icon: IoStatsChartOutline },
    { label: 'Task Completion Rate', value: '84%', icon: IoCheckmarkCircleOutline },
    { label: 'Low-Engagement Flags', value: '12', icon: IoPeopleOutline }
  ];

  const lineChartPoints = ['18', '28', '24', '36', '31', '44', '39'];
  const roleSegments = [
    { label: 'Students', value: summary.students || 0, className: 'segment-student' },
    { label: 'Teachers', value: summary.teachers || 0, className: 'segment-teacher' },
    { label: 'Admins', value: summary.admins || 0, className: 'segment-admin' }
  ];

  return (
    <section className="admin-page">
      <div className="admin-card-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="admin-stat-card" key={card.label}>
              <div className="admin-stat-icon"><Icon /></div>
              <div>
                <div className="admin-stat-label">{card.label}</div>
                <div className="admin-stat-value">{loading ? '...' : formatCount(card.value)}</div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="admin-visual-grid">
        <div className="admin-panel admin-panel-wide">
          <div className="admin-panel-header">
            <div>
              <h2>Active Users (Last 7 Days)</h2>
              <p>Placeholder trend view for engagement and platform usage.</p>
            </div>
          </div>

          <div className="admin-line-chart-placeholder">
            <div className="admin-chart-grid" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((row) => <span key={row} />)}
            </div>
            <div className="admin-chart-line">
              {lineChartPoints.map((value, index) => (
                <span key={`${value}-${index}`} style={{ '--point-x': `${index * 16}%`, '--point-y': `${100 - Number(value)}%` }} />
              ))}
            </div>
            <div className="admin-chart-axis">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>

        <div className="admin-panel admin-panel-wide">
          <div className="admin-panel-header">
            <div>
              <h2>User Roles Distribution</h2>
              <p>Placeholder breakdown of platform roles.</p>
            </div>
          </div>

          <div className="admin-pie-chart-placeholder">
            <div className="admin-pie-chart" aria-hidden="true">
              {roleSegments.reduce((acc, segment) => acc + segment.value, 0) > 0 ? roleSegments.map((segment) => <span key={segment.label} className={segment.className} />) : <span className="segment-student" />}
            </div>
            <div className="admin-pie-legend">
              {roleSegments.map((segment) => (
                <div key={segment.label} className="admin-pie-legend-item">
                  <span className={`legend-swatch ${segment.className}`} />
                  <div>
                    <strong>{segment.label}</strong>
                    <span>{formatCount(segment.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel admin-panel-wide">
        <div className="admin-panel-header">
          <div>
            <h2>Teacher Reviews</h2>
            <p>Review unverified teacher accounts directly from the overview.</p>
          </div>
        </div>
        {error ? <div className="admin-inline-error">{error}</div> : null}
        {message ? <div className="admin-inline-success">{message}</div> : null}
        <div className="admin-mini-chart admin-mini-chart-teacher">
          <span>Pending Requests</span>
          <strong>{teachersLoading ? '...' : formatCount(summary.pendingTeachers || pendingTeachers.length)} pending</strong>
          <p>Quick approve the latest requests without leaving the overview.</p>

          <div className="admin-review-list">
            {(pendingTeachers.slice(0, 4)).map((teacher) => (
              <div className="admin-review-item" key={teacher.id}>
                <div>
                  <strong>{teacher.name || 'Teacher Review'}</strong>
                  <span>{teacher.email}</span>
                </div>
                <button
                  className="admin-action-button"
                  onClick={() => handleQuickApprove(teacher.id)}
                  disabled={approvingId === teacher.id}
                  type="button"
                >
                  <IoCheckmarkCircleOutline />
                  <span>{approvingId === teacher.id ? 'Approving...' : 'Quick Approve'}</span>
                </button>
              </div>
            ))}

            {!teachersLoading && pendingTeachers.length === 0 ? (
              <div className="admin-empty-state">No pending teacher requests right now.</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailUser, setDetailUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pageSize = 10;
  const masterCheckboxRef = useRef(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });

      setUsers(response.data.users || []);
      setSelectedUserIds([]);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (!query) return true;
      return [user.name, user.email, user.role, user.major, user.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [users, searchTerm]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedCount = selectedUserIds.length;
  const rangeStart = totalUsers === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = totalUsers === 0 ? 0 : Math.min(safePage * pageSize, totalUsers);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!masterCheckboxRef.current) return;

    const selectableIds = paginatedUsers.filter((user) => user.id !== currentUser?.id).map((user) => user.id);
    const selectedOnPage = selectableIds.filter((id) => selectedUserIds.includes(id));

    masterCheckboxRef.current.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < selectableIds.length;
    masterCheckboxRef.current.checked = selectableIds.length > 0 && selectedOnPage.length === selectableIds.length;
  }, [paginatedUsers, selectedUserIds, currentUser?.id]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [safePage, totalPages]);

  const selectedUsers = useMemo(
    () => filteredUsers.filter((user) => selectedUserIds.includes(user.id)),
    [filteredUsers, selectedUserIds]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadUsers();
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  };

  const togglePageSelection = () => {
    const selectableIds = paginatedUsers.filter((user) => user.id !== currentUser?.id).map((user) => user.id);

    if (selectableIds.length === 0) return;

    const allSelected = selectableIds.every((id) => selectedUserIds.includes(id));

    setSelectedUserIds((current) => (
      allSelected
        ? current.filter((id) => !selectableIds.includes(id))
        : Array.from(new Set([...current, ...selectableIds]))
    ));
  };

  const runBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    setSavingId(`bulk-${action}`);
    setError('');
    setMessage('');

    try {
      const eligibleUsers = action === 'verify'
        ? selectedUsers.filter((user) => user.role === 'teacher' && !user.teacherVerified && user.id !== currentUser?.id)
        : selectedUsers.filter((user) => user.id !== currentUser?.id);

      const skippedCount = selectedUsers.length - eligibleUsers.length;

      if (eligibleUsers.length === 0) {
        setMessage(action === 'verify'
          ? 'Select pending teacher accounts to bulk verify.'
          : 'Select at least one other account to deactivate.');
        return;
      }

      await Promise.all(
        eligibleUsers.map((selectedUser) => (
          action === 'verify'
            ? adminAPI.verifyTeacher(selectedUser.id, true)
            : adminAPI.updateUserStatus(selectedUser.id, 'deactivated')
        ))
      );

      setUsers((current) => current.map((user) => {
        const matched = eligibleUsers.find((selectedUser) => selectedUser.id === user.id);
        if (!matched) return user;

        if (action === 'verify') {
          return { ...user, role: 'teacher', teacherVerified: true, verifiedAt: new Date().toISOString() };
        }

        return { ...user, accountStatus: 'deactivated' };
      }));

      if (action === 'verify') {
        setSummary((current) => ({
          ...current,
          pendingTeachers: Math.max((current.pendingTeachers || 0) - eligibleUsers.length, 0)
        }));
      }

      setSelectedUserIds((current) => current.filter((id) => !eligibleUsers.some((user) => user.id === id)));
      setMessage(`${eligibleUsers.length} account${eligibleUsers.length === 1 ? '' : 's'} updated${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete bulk action');
    } finally {
      setSavingId(null);
    }
  };

  const updateUser = async (userId, action, payload = {}) => {
    setSavingId(userId);
    setError('');
    setMessage('');

    try {
      let response;
      if (action === 'role') {
        response = await adminAPI.updateUserRole(userId, payload.role);
      } else if (action === 'status') {
        response = await adminAPI.updateUserStatus(userId, payload.accountStatus);
      } else if (action === 'verify') {
        response = await adminAPI.verifyTeacher(userId, true);
      }

      const updatedUser = response?.data?.user;
      if (updatedUser) {
        setUsers((current) => current.map((user) => (user.id === userId ? updatedUser : user)));
      }

      setMessage('Changes saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user');
    } finally {
      setSavingId(null);
    }
  };

  const roleOptions = ['all', 'student', 'teacher', 'admin'];
  const statusOptions = ['all', 'active', 'deactivated'];

  return (
    <section className="admin-page">
      <div className="admin-panel admin-panel-wide">
        <div className="admin-panel-header admin-panel-header-stack">
          <div>
            <h2>User Management</h2>
            <p>Search users, verify teacher registrations, change roles, and deactivate accounts.</p>
          </div>

          <form className="admin-searchbar" onSubmit={handleSearchSubmit}>
            <IoSearchOutline />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, role, or major"
            />
            <button type="submit" className="admin-secondary-button">
              <IoRefreshOutline />
              Refresh
            </button>
          </form>
        </div>

        <div className="admin-filter-row">
          <label>
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="admin-bulk-toolbar">
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => runBulkAction('verify')}
            disabled={selectedCount === 0 || savingId === 'bulk-verify'}
          >
            <IoCheckmarkCircleOutline />
            Bulk Verify
          </button>
          <button
            type="button"
            className="admin-action-button danger"
            onClick={() => runBulkAction('deactivate')}
            disabled={selectedCount === 0 || savingId === 'bulk-deactivate'}
          >
            <IoPowerOutline />
            Bulk Deactivate
          </button>
          <span className="admin-bulk-meta">{selectedCount > 0 ? `${selectedCount} selected` : 'Select users for bulk actions'}</span>
        </div>

        {message ? <div className="admin-inline-success">{message}</div> : null}
        {error ? <div className="admin-inline-error">{error}</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-checkbox-cell">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    onChange={togglePageSelection}
                    aria-label="Select all users on this page"
                    disabled={paginatedUsers.filter((user) => user.id !== currentUser?.id).length === 0}
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">Loading users...</td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">No users matched your filters.</td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <tr key={user.id} className={isSelected ? 'admin-table-row-selected' : ''}>
                      <td className="admin-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isSelf}
                          onChange={() => toggleUserSelection(user.id)}
                          aria-label={`Select ${user.name || user.email || 'user'}`}
                        />
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{(user.name || user.email || '?').charAt(0).toUpperCase()}</div>
                          <div>
                            <button
                              type="button"
                              className="admin-user-name-button"
                              onClick={() => setDetailUser(user)}
                            >
                              {user.name || 'Unnamed user'}
                            </button>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pill admin-pill-role role-${user.role}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`admin-pill admin-pill-status status-${user.accountStatus}`}>{user.accountStatus}</span>
                      </td>
                      <td>
                        {user.role === 'teacher' ? (
                          user.teacherVerified ? <span className="admin-verified">Verified</span> : <span className="admin-pending">Pending</span>
                        ) : (
                          <span className="admin-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-action-group">
                          {user.role === 'teacher' && !user.teacherVerified ? (
                            <button className="admin-action-button" onClick={() => updateUser(user.id, 'verify')} disabled={savingId === user.id || isSelf} type="button">
                              <IoCheckmarkCircleOutline />
                              Verify
                            </button>
                          ) : null}

                          <button className="admin-action-button" onClick={() => updateUser(user.id, 'role', { role: user.role === 'student' ? 'teacher' : 'student' })} disabled={savingId === user.id || isSelf || user.role === 'admin'} type="button">
                            <IoSwapHorizontalOutline />
                            {user.role === 'student' ? 'Make Teacher' : 'Make Student'}
                          </button>

                          <button className="admin-action-button" onClick={() => updateUser(user.id, 'role', { role: 'admin' })} disabled={savingId === user.id || isSelf || user.role === 'admin'} type="button">
                            <IoShieldCheckmarkOutline />
                            Admin
                          </button>

                          <button
                            className="admin-action-button danger"
                            onClick={() => updateUser(user.id, 'status', { accountStatus: user.accountStatus === 'deactivated' ? 'active' : 'deactivated' })}
                            disabled={savingId === user.id || isSelf}
                            type="button"
                          >
                            <IoPowerOutline />
                            {user.accountStatus === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-footer">
          <div className="admin-table-summary">
            Showing {rangeStart}-{rangeEnd} of {totalUsers} users
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={safePage === 1}
            >
              Previous
            </button>

            <div className="admin-page-numbers">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`admin-page-button${pageNumber === safePage ? ' active' : ''}`}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {detailUser ? (
          <div className="admin-modal-overlay" onClick={() => setDetailUser(null)}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <div>
                  <h3>Detailed View</h3>
                  <p>Profile snapshot for this user.</p>
                </div>
                <button type="button" className="admin-modal-close" onClick={() => setDetailUser(null)}>
                  Close
                </button>
              </div>

              <div className="admin-modal-user">
                <div className="admin-user-avatar admin-user-avatar-large">{(detailUser.name || detailUser.email || '?').charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{detailUser.name || 'Unnamed user'}</strong>
                  <span>{detailUser.email}</span>
                </div>
              </div>

              <div className="admin-modal-grid">
                <div>
                  <span>Role</span>
                  <strong>{detailUser.role}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{detailUser.accountStatus}</strong>
                </div>
                <div>
                  <span>Verification</span>
                  <strong>{detailUser.role === 'teacher' ? (detailUser.teacherVerified ? 'Verified' : 'Pending') : 'N/A'}</strong>
                </div>
                <div>
                  <span>Department</span>
                  <strong>{detailUser.department || 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export const AdminAcademicSetup = () => {
  const [majors, setMajors] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [majorName, setMajorName] = useState('');
  const [majorCode, setMajorCode] = useState('');
  const [semesterName, setSemesterName] = useState('');
  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAcademicData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getAcademicSetup();
      setMajors(response.data.majors || []);
      setSemesters(response.data.semesters || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load academic setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  const addMajor = async (event) => {
    event.preventDefault();
    await adminAPI.createMajor({ name: majorName, code: majorCode });
    setMajorName('');
    setMajorCode('');
    await loadAcademicData();
  };

  const addSemester = async (event) => {
    event.preventDefault();
    await adminAPI.createSemester({ name: semesterName, startsOn: semesterStart, endsOn: semesterEnd });
    setSemesterName('');
    setSemesterStart('');
    setSemesterEnd('');
    await loadAcademicData();
  };

  const toggleMajor = async (major) => {
    await adminAPI.updateMajor(major.id, { isActive: !major.is_active });
    await loadAcademicData();
  };

  const toggleSemester = async (semester) => {
    await adminAPI.updateSemester(semester.id, { isActive: !semester.is_active });
    await loadAcademicData();
  };

  return (
    <section className="admin-page admin-academic-page">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Academic Setup</h2>
            <p>Manage majors, semesters, and supporting scheduling configuration.</p>
          </div>
        </div>

        {error ? <div className="admin-inline-error">{error}</div> : null}

        <div className="admin-dual-grid">
          <form className="admin-form-card admin-academic-card" onSubmit={addMajor}>
            <div className="admin-form-title">
              <IoSchoolOutline />
              <h3>Majors</h3>
            </div>
            <label>
              <span>Name</span>
              <input value={majorName} onChange={(event) => setMajorName(event.target.value)} placeholder="Computer Science" required />
            </label>
            <label>
              <span>Code</span>
              <input value={majorCode} onChange={(event) => setMajorCode(event.target.value)} placeholder="CS" />
            </label>
            <button className="admin-primary-button" type="submit">
              <IoAddOutline />
              Add Major
            </button>

            <div className="admin-list">
              {(loading ? [] : majors).map((major) => (
                <div className="admin-list-item" key={major.id}>
                  <div>
                    <strong>{major.name}</strong>
                    <span>{major.code || 'No code set'}</span>
                  </div>
                  <button type="button" className="admin-secondary-button" onClick={() => toggleMajor(major)}>
                    <IoPencilOutline />
                    {major.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </form>

          <form className="admin-form-card admin-academic-card" onSubmit={addSemester}>
            <div className="admin-form-title">
              <IoCalendarOutline />
              <h3>Semesters</h3>
            </div>
            <label>
              <span>Name</span>
              <input value={semesterName} onChange={(event) => setSemesterName(event.target.value)} placeholder="AY 2026 - Semester 1" required />
            </label>
            <label>
              <span>Starts On</span>
              <input type="date" value={semesterStart} onChange={(event) => setSemesterStart(event.target.value)} />
            </label>
            <label>
              <span>Ends On</span>
              <input type="date" value={semesterEnd} onChange={(event) => setSemesterEnd(event.target.value)} />
            </label>
            <button className="admin-primary-button" type="submit">
              <IoAddOutline />
              Add Semester
            </button>

            <div className="admin-list">
              {(loading ? [] : semesters).map((semester) => (
                <div className="admin-list-item" key={semester.id}>
                  <div>
                    <strong>{semester.name}</strong>
                    <span>{semester.starts_on || 'No start date'} - {semester.ends_on || 'No end date'}</span>
                  </div>
                  <button type="button" className="admin-secondary-button" onClick={() => toggleSemester(semester)}>
                    <IoPencilOutline />
                    {semester.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </form>
        </div>

      </div>
    </section>
  );
};

export const AdminSystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const booleanSettingKeys = new Set([
    'registration_open',
    'semester_in_progress',
    'teacher_approval_required'
  ]);

  const isBooleanSetting = (setting) => {
    if (!setting?.setting_key) return false;
    if (booleanSettingKeys.has(setting.setting_key)) return true;
    return ['true', 'false'].includes(String(setting.setting_value).toLowerCase());
  };

  const toBoolean = (setting) => String(setting.setting_value).toLowerCase() === 'true';

  const recentActivity = [
    { timestamp: '2026-05-28 09:42', admin: 'Hamboss Admin', action: 'Enabled teacher approval required' },
    { timestamp: '2026-05-28 09:18', admin: 'Hamboss Admin', action: 'Opened registration for new students' },
    { timestamp: '2026-05-27 16:03', admin: 'Campus Ops', action: 'Marked semester as in progress' }
  ];

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const response = await adminAPI.getSettings();
        if (!active) return;
        setSettings(response.data.settings || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Unable to load settings');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updateSettingValue = (settingKey, settingValue) => {
    setSettings((current) => current.map((setting) => (setting.setting_key === settingKey ? { ...setting, setting_value: settingValue } : setting)));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = settings.map((setting) => ({
        settingKey: setting.setting_key,
        settingValue: setting.setting_value
      }));
      const response = await adminAPI.saveSettings(payload);
      setSettings(response.data.settings || []);
      setMessage('System settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <form className="admin-panel admin-panel-wide" onSubmit={handleSave}>
        <div className="admin-panel-header">
          <div>
            <h2>System Settings</h2>
            <p>Control high-level platform switches that affect registration and term availability.</p>
          </div>
        </div>

        {loading ? <div className="admin-empty-state">Loading settings...</div> : null}
        {message ? <div className="admin-inline-success">{message}</div> : null}
        {error ? <div className="admin-inline-error">{error}</div> : null}

        <div className="admin-settings-editor">
          {settings.map((setting) => (
            <label className="admin-setting-editor" key={setting.setting_key}>
              <div className="admin-setting-heading">
                <span>{setting.setting_key}</span>
                {isBooleanSetting(setting) ? (
                  <span className="admin-setting-status">{toBoolean(setting) ? 'Enabled' : 'Disabled'}</span>
                ) : null}
              </div>

              {isBooleanSetting(setting) ? (
                <label className="admin-toggle-switch">
                  <input
                    type="checkbox"
                    checked={toBoolean(setting)}
                    onChange={(event) => updateSettingValue(setting.setting_key, event.target.checked ? 'true' : 'false')}
                  />
                  <span className="admin-toggle-track" aria-hidden="true">
                    <span className="admin-toggle-thumb" />
                  </span>
                  <span className="admin-toggle-label">{toBoolean(setting) ? 'On' : 'Off'}</span>
                </label>
              ) : (
                <input
                  value={setting.setting_value || ''}
                  onChange={(event) => updateSettingValue(setting.setting_key, event.target.value)}
                  placeholder="value"
                />
              )}
            </label>
          ))}
        </div>

        <div className="admin-activity-log">
          <div className="admin-panel-header">
            <div>
              <h3>Recent Activity Log</h3>
              <p>Audit-style placeholder for recent system setting changes.</p>
            </div>
          </div>

          <div className="admin-activity-list">
            {recentActivity.map((entry) => (
              <div className="admin-activity-item" key={`${entry.timestamp}-${entry.action}`}>
                <span className="admin-activity-time">{entry.timestamp}</span>
                <strong>{entry.admin}</strong>
                <span>{entry.action}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="admin-primary-button" type="submit" disabled={saving}>
          <IoSettingsOutline />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </section>
  );
};

export default AdminDashboard;
