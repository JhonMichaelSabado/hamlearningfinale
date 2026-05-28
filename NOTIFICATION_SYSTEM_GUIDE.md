# 🚀 HamLearning LMS - Automated Notification System (v2)

## System Overview

A **fully automated, role-based email notification system** for all users in your Learning Management System. Notifications are triggered automatically based on user activities and sent via Gmail.

---

## ✅ What's Included

### Automated Notifications (5 Types)

| Notification | Triggered When | Recipient | Purpose |
|---|---|---|---|
| **📬 Submission Received** | Student submits task work | Teacher | Aware of new submissions to grade |
| **✅ Work Graded** | Teacher grades submission | Student | Know their score, feedback, progress |
| **📚 New Assignment** | Teacher creates task | All class students | Aware of new work to complete |
| **⏰ Deadline Reminder** | 24 hours before deadline | Students (not yet submitted) | Complete work before deadline |
| **📢 Announcement** | Teacher posts announcement | All class students | Stay informed of important info |

---

## 🔧 Setup Requirements

### 1. Gmail Configuration (Critical)

You must use a **Gmail App Password**, NOT your regular Gmail password.

**Steps:**

1. Go to: https://myaccount.google.com/apppasswords
2. Make sure **2-Factor Authentication is enabled** first
3. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your OS)
4. Copy the **16-character App Password**
5. Use this in your environment variables

### 2. Environment Variables (Vercel)

Set these in Vercel Project Settings → Environment Variables:

```
EMAIL_USER = your.email@gmail.com
EMAIL_PASSWORD = xxxx xxxx xxxx xxxx (the App Password from step above)
FRONTEND_URL = https://yourdomain.vercel.app
BACKEND_URL = https://your-api.vercel.app
```

**Testing:**
```bash
GET https://your-api.vercel.app/api/diagnostics/health
GET https://your-api.vercel.app/api/diagnostics/email-status
```

---

## 📧 Notification Details

### 1. Submission Received Notification
**When:** Student submits work via the Tasks dashboard
**Recipient:** Task Teacher
**Contains:**
- Student name who submitted
- Task/assignment title
- File name (if attached)
- Link to review submissions
- Time submitted

### 2. Work Graded Notification
**When:** Teacher grades a student's submission
**Recipient:** Student who submitted
**Contains:**
- Task title
- Score received (e.g., 8/10)
- Percentage grade
- Feedback from teacher (if provided)
- Link to dashboard

### 3. New Assignment Notification
**When:** Teacher creates a new task for a class
**Recipient:** All students enrolled in that class
**Contains:**
- Assignment title
- Due date
- Brief description
- Link to view full details
- Reminder to submit on time

### 4. Deadline Reminder Notification
**When:** 24 hours before assignment deadline
**Recipient:** Students who haven't yet submitted
**Contains:**
- Hours remaining until deadline
- Assignment title
- Exact deadline date/time
- Urgent reminder to submit
- Link to submit work

### 5. Class Announcement Notification
**When:** Teacher posts announcement
**Recipient:** All students in that class
**Contains:**
- Announcement title
- Message preview
- Teacher name
- Link to full announcement

---

## 🏗️ System Architecture

### File Structure

```
backend/
├── services/
│   ├── notificationEngine.js  ← Main notification system
│   └── deadlineReminderJob.js ← Background job for reminders
├── routes/
│   ├── tasks.js              ← Triggers notifications
│   └── diagnostics.js        ← Testing endpoints
└── server.js                 ← Initializes deadline job
```

---

## 🧪 Testing Notifications

### Test 1: Check Email Service Status
```bash
GET https://your-api.vercel.app/api/diagnostics/email-status
```

Response should show:
```json
{
  "email_service": {
    "configured": true,
    "email_user": "✓ Set to: your.email@gmail.com",
    "email_password": "✓ Set (length: 16)"
  }
}
```

### Test 2: Send Test Email
```bash
POST https://your-api.vercel.app/api/diagnostics/test-email
Content-Type: application/json

{
  "to": "test@example.com"
}
```

Should receive test email with HamLearning branding

### Test 3: Full Flow Test

1. **Create a class** with students enrolled
2. **Create an assignment** with a due date
   - Check that all students receive "📚 New Assignment" email
3. **Student submits work**
   - Check that teacher receives "📬 New Submission" email
4. **Teacher grades submission**
   - Check that student receives "✅ Work Graded" email with score/feedback

---

## 🔍 Debugging

### Common Issues

#### Issue: Notifications not being sent
**Check:**
1. Run `/api/diagnostics/health` - should return `{ "status": "ok" }`
2. Run `/api/diagnostics/email-status` - check EMAIL_USER and EMAIL_PASSWORD
3. Run `/api/diagnostics/test-email` - verify test email is received

#### Issue: "Email service not configured"
**Solution:**
1. Verify EMAIL_USER is set in Vercel (must be @gmail.com address)
2. Verify EMAIL_PASSWORD is 16-character App Password (NOT regular password)
3. Check Vercel logs for error messages

#### Issue: Emails go to spam folder
**Solutions:**
- Add sender to contacts: Set up emails from HamLearning address to trusted
- Check Gmail filter rules
- Report as "Not Spam" in Gmail

### Vercel Logs

Check real-time logs in Vercel dashboard:
- Settings → Functions & Observability → Runtime Logs
- Search for: "NOTIFICATION", "EMAIL", "📧"

---

## 🚀 Installation Checklist

- [ ] Set EMAIL_USER in Vercel (Gmail address)
- [ ] Set EMAIL_PASSWORD in Vercel (16-char App Password)
- [ ] Set FRONTEND_URL in Vercel
- [ ] Set BACKEND_URL in Vercel
- [ ] Test `/api/diagnostics/health` - should return OK
- [ ] Test `/api/diagnostics/email-status` - should show configured
- [ ] Test `/api/diagnostics/test-email` - should receive test email
- [ ] Create test class with students
- [ ] Create test assignment - verify students get email
- [ ] Submit test work - verify teacher gets email
- [ ] Grade test work - verify student gets email

---

## 📊 Features

✅ **Fully Automated** - Notifications trigger automatically on user actions
✅ **Role-Based** - Different notifications for teachers vs students
✅ **Professional Design** - HamLearning branded emails with colors
✅ **Non-Blocking** - Email failures don't crash the application
✅ **Comprehensive** - Covers all major LMS activities
✅ **Production-Ready** - Works for all users in your system

---

## 🚀 Future Enhancements

- [ ] SMS notifications for critical deadlines
- [ ] In-app notification center (besides email)
- [ ] Customizable notification preferences per user
- [ ] Notification digest (daily/weekly summary)
- [ ] Parent/guardian notifications for student progress
- [ ] Slack integration for teachers
- [ ] Push notifications for mobile app

---

**© 2025 HamLearning LMS - Automated Notification System**

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
