# HamLearning Automated Email Notification System

## Overview

This system provides automated email notifications for all critical LMS activities with a consistent, professional design. All emails use the HamLearning brand theme and include functional action buttons.

## Features Implemented

### 1. **New Activity Posted** 📋
- **When:** Teacher creates a new activity/task
- **Who:** All students enrolled in the class
- **Content:** Activity title, description, class name, instructor name
- **Action Button:** "View Activity" - links to class activities page

### 2. **Deadline Reminders** ⏰
- **When:** 24 hours before deadline (configurable)
- **Who:** All students with pending tasks
- **Content:** Task title, due date, time remaining, class name
- **Frequency:** Automated, runs every hour
- **Action Button:** "View & Submit" - links to tasks dashboard

### 3. **Activity Graded** ✅
- **When:** Teacher grades a submission
- **Who:** The submitting student
- **Content:** Activity title, score with percentage, instructor feedback
- **Features:** 
  - Displays score breakdown (e.g., "85/100 (85%)")
  - Shows instructor feedback in a formatted box
  - Professional score display badge
- **Action Button:** "View Detailed Feedback"

### 4. **Submission Received** 📤
- **When:** Student submits an activity
- **Who:** The teacher/instructor
- **Content:** Student name, email, activity title, attachment name, submission preview
- **Purpose:** Immediate notification for teacher review
- **Action Button:** "Review Submission" - links to grading interface

---

## Technical Architecture

### Email Service (`backend/services/emailService.js`)
Central service for all email operations with:
- Reusable email templates with HamLearning brand
- Error handling that doesn't crash the application
- Four main notification functions:
  - `notifyNewActivity(classId, activityTitle, description)`
  - `notifyDeadlineReminder(taskId, hoursUntilDeadline)`
  - `notifyActivityGraded(submissionId, studentId, taskId, score, feedback, maxScore)`
  - `notifySubmissionReceived(taskId, studentId, teacherId, fileName, submissionText)`

### Deadline Reminder Job (`backend/services/deadlineReminderJob.js`)
Background job that:
- Runs every hour (configurable via `DEADLINE_CHECK_INTERVAL`)
- Queries tasks with deadlines in the next 24 hours
- Sends personalized reminders to all enrolled students
- Automatically initialized when server starts

### Integration Points
**Updated routes:**
- `POST /api/tasks/submit/:taskId` - Notifies teacher on submission
- `PATCH /api/tasks/submission/:submissionId/grade` - Notifies student on grading

**Server initialization:**
- `server.js` now calls `initializeDeadlineReminders()` on startup

---

## Design Features

### Brand Consistency
- **Primary Color:** `#2d7a4f` (Green)
- **Dark Color:** `#1e5a3a` (Dark Green)
- **Logo:** HamLearning branding on all emails
- **Header Gradient:** Professional gradient with brand colors

### Email Components
1. **Header** - Brand logo and email purpose
2. **Content** - Main message and activity details
3. **Activity Card** - Key information in styled box
4. **Score Display** - Large badge for grading emails
5. **Feedback Section** - Formatted feedback from instructors
6. **CTA Button** - Action button with working links
7. **Footer** - Copyright and disclaimer

### Dynamic Links
All action buttons link to actual application URLs:
- Uses `FRONTEND_URL` environment variable
- Falls back to `http://localhost:3000` for development
- Includes specific routes for each action type

---

## Setup & Configuration

### Environment Variables Required
```env
# Gmail SMTP Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# URLs for email links
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Optional: Deadline check interval (default: 1 hour = 3600000 ms)
DEADLINE_CHECK_INTERVAL=3600000
```

### Gmail Setup (Important!)
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" at: https://myaccount.google.com/apppasswords
3. Use the 16-character App Password (not your regular Gmail password) in `EMAIL_PASSWORD`

### Installation & First Run
```bash
# No additional packages needed - uses existing nodemailer

# On server startup, you should see:
# "Deadline reminder job initialized. Checking every 60 minutes"

# Verify email service is configured:
# Check logs for: "Email sent successfully to: student@example.com"
```

---

## Usage Examples

### Sending New Activity Notification
```javascript
const { notifyNewActivity } = require('../services/emailService');

// In your activities/deadlines route
router.post('/create', verifyToken, async (req, res) => {
  // ... create activity logic ...
  
  // Notify all students
  await notifyNewActivity(
    classId,
    'Math Quiz - Chapter 5',
    'Complete the quiz covering chapters 4-5'
  );
  
  res.status(201).json(newActivity);
});
```

### Sending Grading Notification (Already Integrated)
```javascript
// In submission grading endpoint (already implemented in tasks.js)
await notifyActivityGraded(
  submissionId,
  studentId,
  taskId,
  85,  // score
  'Great work! Minor grammar issues.',  // feedback
  100  // maxScore
);
```

### Testing Email Service
```javascript
// Manual test in your routes
const { sendEmailSafely } = require('../services/emailService');

const testEmail = {
  from: process.env.EMAIL_USER,
  to: 'teststudent@example.com',
  subject: 'Test Email',
  html: '<h1>Test Email</h1><p>This is a test.</p>'
};

const result = await sendEmailSafely(testEmail);
console.log(result); // { success: true } or { success: false, error: '...' }
```

---

## Error Handling & Reliability

### Graceful Failure Design
- If Gmail SMTP is not configured, emails log a warning instead of crashing
- Individual email failures don't affect application operation
- All database operations complete even if email fails
- Comprehensive error logging for debugging

### Retry Strategy
Currently, emails don't retry on failure. To add retries, you can use a job queue library like:
- `bull` - Redis-based job queue
- `bree` - Lightweight job scheduler
- `node-cron` - Simple cron jobs (install via npm)

**To upgrade to `node-cron`:**
```bash
npm install node-cron
```

Then in `deadlineReminderJob.js`:
```javascript
const cron = require('node-cron');

// Run at top of every hour
cron.schedule('0 * * * *', checkAndNotifyDeadlines);
```

---

## Customization Guide

### Change Email Brand Colors
Edit `backend/services/emailService.js`:
```javascript
const BRAND_COLOR = '#2d7a4f';      // Change this
const BRAND_DARK = '#1e5a3a';       // And this
```

### Adjust Deadline Reminder Timing
Option 1 - Environment variable:
```env
DEADLINE_CHECK_INTERVAL=1800000  # 30 minutes instead of 60
```

Option 2 - Edit the job file:
```javascript
// In deadlineReminderJob.js
const interval = 30 * 60 * 1000;  // 30 minutes
```

### Change Deadline Notification Window
Edit `backend/services/deadlineReminderJob.js`:
```javascript
// Currently: 24 hours
const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

// Change to 12 hours:
const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
.lte('due_date', in12Hours.toISOString())
```

### Add Custom Email Template
```javascript
const notifyCustomEvent = async (userEmail, userName, eventData) => {
  const mailContent = `
    <div class="header">
      <h1>📌 HamLearning</h1>
      <p>Custom Event</p>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Your custom event details here...</p>
      <a href="${process.env.FRONTEND_URL}/custom-page" class="button">
        View Details
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Custom Event Notification',
    html: getEmailTemplate(mailContent)
  };

  return await sendEmailSafely(mailOptions);
};
```

---

## Monitoring & Debugging

### Check Email Logs
```bash
# In server logs, look for:
# "Email sent successfully to: [email]"
# "Error sending email: [error message]"
# "Email service not configured - skipping email"
```

### Monitor Deadline Job
```bash
# You should see on startup:
# "Deadline reminder job initialized. Checking every 60 minutes"
# "Checking for upcoming deadlines..."
# "Found X tasks with upcoming deadlines"
```

### Test Email Delivery
1. Create a test task with deadline 2 hours from now
2. Check server logs after next hour mark
3. Verify email arrives in inbox
4. Check spam folder if not found

### Troubleshooting

**Problem:** "Email service not configured"
- **Solution:** Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set in Vercel environment variables

**Problem:** Emails not sending despite configuration
- **Solution:** 
  - Verify App Password (not regular Gmail password)
  - Check Gmail account has 2FA enabled
  - Verify `FRONTEND_URL` is correct
  - Check spam folder

**Problem:** Deadline reminders not running
- **Solution:**
  - Verify server is running
  - Check logs for "Deadline reminder job initialized"
  - Verify tasks exist with due_date in the future

---

## Future Enhancements

1. **Email Preferences**
   - Allow students/teachers to unsubscribe from certain notifications
   - Digest emails (daily/weekly summary)

2. **Queue Management**
   - Implement job queue for retry logic
   - Handle bulk emails more efficiently

3. **SMS Fallback**
   - Integrate Twilio for SMS notifications
   - Fallback when email delivery fails

4. **Rich Text Editor**
   - Allow teachers to customize notification templates
   - HTML editing for activity descriptions in emails

5. **Analytics**
   - Track email open rates
   - Monitor delivery success rates
   - Dashboard of notification statistics

---

## Testing Checklist

- [ ] Gmail is configured with App Password
- [ ] Environment variables set in Vercel
- [ ] Server starts without errors
- [ ] "Deadline reminder job initialized" in logs
- [ ] Create a test activity → student receives email
- [ ] Student submits → teacher receives email
- [ ] Teacher grades → student receives email with score
- [ ] Check email brand colors and buttons work
- [ ] Verify all action buttons link to correct pages
- [ ] Test with 24-hour deadline task → reminder sends

---

## Support & Debugging

For issues, check:
1. Server logs for error messages
2. Vercel environment variables
3. Gmail account access and App Password
4. Network connectivity in logs
5. Supabase queries for required data

Contact: [Your support email]
