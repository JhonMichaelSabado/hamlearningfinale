require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDeadlineReminders } = require('./services/deadlineReminderJob');
const supabase = require('./config/supabase');

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
const diagnosticsRoutes = require('./routes/diagnostics');

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
  adminRoutes,
  diagnosticsRoutes
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
app.use('/api/diagnostics', routes.diagnosticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LMS Backend API is running' });
});

// DIAGNOSTIC: Check notification engine status
app.get('/api/diagnostic/notification-status', (req, res) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  res.json({
    status: 'diagnostic',
    timestamp: new Date().toISOString(),
    environmentVariables: {
      EMAIL_USER_defined: !!emailUser,
      EMAIL_USER_preview: emailUser ? `${emailUser.substring(0, 5)}...` : 'undefined',
      EMAIL_PASSWORD_defined: !!emailPassword,
      EMAIL_PASSWORD_length: emailPassword ? emailPassword.length : 0,
      FRONTEND_URL_defined: !!process.env.FRONTEND_URL,
      BACKEND_URL_defined: !!process.env.BACKEND_URL,
      VERCEL_ENV: process.env.VERCEL_ENV || 'local'
    },
    message: emailUser && emailPassword ? '✅ Credentials configured' : '❌ Credentials missing'
  });
});

// DIAGNOSTIC: Check enrollment and email for a student
app.get('/api/diagnostic/student-enrollment/:email/:classId', async (req, res) => {
  try {
    const { email, classId } = req.params;
    
    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (!user) {
      return res.json({
        status: 'diagnostic',
        email: email,
        classId: classId,
        userFound: false,
        message: `❌ User with email "${email}" not found in database`
      });
    }

    // Check if enrolled in class
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, class_id, user_id')
      .eq('user_id', user.id)
      .eq('class_id', parseInt(classId))
      .single();

    res.json({
      status: 'diagnostic',
      email: email,
      classId: classId,
      userFound: true,
      userId: user.id,
      userName: user.name,
      storedEmail: user.email,
      enrolled: !!enrollment,
      enrollmentData: enrollment || null,
      message: enrollment ? `✅ Student IS enrolled in class ${classId}` : `❌ Student NOT enrolled in class ${classId}`
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize background jobs
  initializeDeadlineReminders();
});