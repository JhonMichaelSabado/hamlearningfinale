require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDeadlineReminders } = require('./services/deadlineReminderJob');

// Route Imports
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google-auth');
const classRoutes = require('./routes/classes');
const passwordResetRoutes = require('./routes/password-reset');
const scheduleRoutes = require('./routes/schedules');
const deadlineRoutes = require('./routes/deadlines-new');
const submissionRoutes = require('./routes/submissions');
const gradeRoutes = require('./routes/grades');
const taskRoutes = require('./routes/tasks.js');
const fileRoutes = require('./routes/files-local');
const archiveRoutes = require('./routes/archive');
const wellnessRoutes = require('./routes/wellness');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// DIAGNOSTIC + Normalization: Accept common bundler wrappers
const rawRoutes = {
  authRoutes,
  googleAuthRoutes,
  classRoutes,
  passwordResetRoutes,
  scheduleRoutes,
  deadlineRoutes,
  submissionRoutes,
  gradeRoutes,
  taskRoutes,
  fileRoutes,
  archiveRoutes,
  wellnessRoutes,
  adminRoutes
};

const normalizeRoute = (name, route) => {
  if (typeof route === 'function') return route;
  if (!route || typeof route !== 'object') return route;

  // Common wrappers: default, router
  if (typeof route.default === 'function') return route.default;
  if (typeof route.router === 'function') return route.router;

  // If bundler wrapped exports as an object with the router as a property
  // (e.g., { tasks: [Function], ... }), attempt to find the first function value.
  for (const val of Object.values(route)) {
    if (typeof val === 'function') return val;
    if (val && typeof val.default === 'function') return val.default;
    if (val && typeof val.router === 'function') return val.router;
  }

  return route;
};

const routes = {};
Object.entries(rawRoutes).forEach(([name, route]) => {
  const resolved = normalizeRoute(name, route);
  if (typeof resolved !== 'function') {
    throw new Error(`CRITICAL ERROR: Route '${name}' is not a valid Express router! It is of type: ${typeof resolved}. Ensure you are exporting 'module.exports = router' or a default/function export.`);
  }
  routes[name] = resolved;
});

console.log('All routes validated and normalized successfully.');

// Routes (use normalized router functions from `routes`)
app.use('/api/auth', routes.authRoutes);
app.use('/api/google', routes.googleAuthRoutes);
app.use('/api/classes', routes.classRoutes);
app.use('/api/password', routes.passwordResetRoutes);
app.use('/api/schedules', routes.scheduleRoutes);
app.use('/api/deadlines', routes.deadlineRoutes);
app.use('/api/submissions', routes.submissionRoutes);
app.use('/api/grades', routes.gradeRoutes);
app.use('/api/tasks', routes.taskRoutes);
app.use('/api/files', routes.fileRoutes);
app.use('/api/archive', routes.archiveRoutes);
app.use('/api/wellness', routes.wellnessRoutes);
app.use('/api/admin', routes.adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LMS Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize background jobs
  initializeDeadlineReminders();
});