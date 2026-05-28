require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/google-auth');
const classRoutes = require('./routes/classes');
const passwordResetRoutes = require('./routes/password-reset');
const scheduleRoutes = require('./routes/schedules');
const deadlineRoutes = require('./routes/deadlines-new');
const submissionRoutes = require('./routes/submissions');
const gradeRoutes = require('./routes/grades');
const taskRoutes = require('./routes/tasks');
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

// DIAGNOSTIC CODE: Validate routes before mounting
const routes = {
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

Object.entries(routes).forEach(([name, route]) => {
  // Express routers are functions. If it's an object, it might be { router } instead of router.
  if (typeof route !== 'function') {
    throw new Error(`CRITICAL ERROR: Route '${name}' is not a valid Express router! It is of type: ${typeof route}. Ensure you are exporting 'module.exports = router' and NOT '{ router }'.`);
  }
});
console.log("All routes validated successfully.");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LMS Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});