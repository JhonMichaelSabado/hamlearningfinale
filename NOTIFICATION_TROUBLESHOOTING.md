# 🔧 Notification System - Troubleshooting Guide

**Problem:** Notifications are not being sent to students/teachers even though code is deployed.

---

## ⚡ Quick Diagnosis (5 minutes)

### Step 1: Check if Vercel has Email Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Look for:
```
EMAIL_USER = ?
EMAIL_PASSWORD = ?
```

**If NOT present:** This is the problem! ❌
**If present:** Go to Step 2

---

### Step 2: Test the Diagnostic Endpoint

Open your browser and go to:

```
https://hamlearningfinale.vercel.app/api/diagnostics/email-status
```

**Expected response if working:**
```json
{
  "email_service": {
    "configured": true,
    "email_user": "✓ Set to: your.email@gmail.com",
    "email_password": "✓ Set (length: 16)"
  }
}
```

**If you see:**
```json
{
  "email_service": {
    "configured": false,
    "email_user": "✗ Not set",
    "email_password": "✗ Not set"
  }
}
```

Then environment variables are NOT in Vercel. ❌

---

### Step 3: Send a Test Email

```
POST https://hamlearningfinale.vercel.app/api/diagnostics/test-email
Content-Type: application/json

{
  "to": "your-email@gmail.com"
}
```

**You should receive an email within 30 seconds.**

If no email: Email service is not configured.

---

## 🚀 How to Fix It

### Option A: Add Environment Variables to Vercel (REQUIRED)

1. **Go to Vercel Dashboard**
   - Project: hamlearningfinale
   - Click: Settings
   - Click: Environment Variables

2. **Add EMAIL_USER**
   - Name: `EMAIL_USER`
   - Value: `your.email@gmail.com`
   - Select: Production, Preview, Development
   - Click: Save

3. **Add EMAIL_PASSWORD**
   - Name: `EMAIL_PASSWORD`
   - Value: `xxxx xxxx xxxx xxxx` (16-character Gmail App Password)
   - Select: Production, Preview, Development
   - Click: Save

4. **Wait for Redeploy**
   - Vercel automatically redeploys (2-3 minutes)
   - Check: Deployments tab

5. **Test Again**
   - Go to: `/api/diagnostics/email-status`
   - Should show `"configured": true`

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Email service not configured"

**Symptoms:**
- `/api/diagnostics/email-status` shows all `✗ Not set`
- Logs show: `⚠️ [NOTIFICATION ENGINE] Email service NOT configured`

**Solution:**
1. Add EMAIL_USER and EMAIL_PASSWORD to Vercel environment variables
2. Redeploy
3. Test with `/api/diagnostics/test-email`

### Issue 2: "Gmail SMTP connection failed"

**Symptoms:**
- Test email fails with error about Gmail authentication
- Logs show: `❌ Email transporter verification failed`

**Solutions:**
1. Verify you're using **App Password, NOT regular Gmail password**
   - Go to: https://myaccount.google.com/apppasswords
   - If not available: Enable 2-factor authentication first
   - Generate new app password for "Mail" on "Windows Computer"
   - Copy the 16 characters (looks like: `xxxx xxxx xxxx xxxx`)
   - Paste into Vercel EMAIL_PASSWORD

2. Verify Gmail account:
   - Make sure it's the correct Gmail address
   - Check email is spelled correctly (no typos)

3. Re-add to Vercel and test

### Issue 3: Emails go to spam folder

**Solutions:**
1. Check Gmail spam/promotions folder
2. Mark as "Not Spam"
3. Add noreply@hamlearning.com to contacts

### Issue 4: Notifications were sent before, now they stopped

**Possible causes:**
1. Gmail App Password expired (regenerate at https://myaccount.google.com/apppasswords)
2. Environment variables were accidentally deleted from Vercel
3. Vercel billing issue (check Vercel dashboard)

**Solution:**
1. Check Vercel environment variables still exist
2. Regenerate Gmail App Password if older than 30 days
3. Test with `/api/diagnostics/test-email`

---

## 🧪 Full End-to-End Test

Once email service is working, test the complete notification flow:

### Test 1: New Assignment Notification

1. **Create a Class** (as Teacher)
   - Class name: "Test Class"
   - Add students to the class

2. **Create an Assignment** (as Teacher)
   - Title: "Test Assignment"
   - Due date: Tomorrow
   - Description: "This is a test"

3. **Check Student Email**
   - Should receive: "📚 New Assignment: Test Assignment"
   - Email should have HamLearning branding
   - Should have "View Assignment" button

### Test 2: Submission Notification

1. **Submit Work** (as Student)
   - Go to task
   - Click Submit
   - Upload file or enter text

2. **Check Teacher Email**
   - Should receive: "📬 New Submission: Test Assignment"
   - Email should show student name
   - Should have "View Submission" button

### Test 3: Grading Notification

1. **Grade Submission** (as Teacher)
   - Go to submissions
   - Enter score (e.g., 8/10)
   - Enter feedback: "Great work!"
   - Click Grade

2. **Check Student Email**
   - Should receive: "✅ Work Graded: Test Assignment"
   - Email should show score: "8/10 (80%)"
   - Email should show feedback: "Great work!"

---

## 📊 Verification Checklist

- [ ] Vercel environment variables set (EMAIL_USER, EMAIL_PASSWORD)
- [ ] `/api/diagnostics/health` returns `{ "status": "ok" }`
- [ ] `/api/diagnostics/email-status` returns `"configured": true`
- [ ] `/api/diagnostics/test-email` successfully sends test email
- [ ] Created test class with enrolled students
- [ ] Teacher created assignment → Students received email
- [ ] Student submitted work → Teacher received email
- [ ] Teacher graded work → Student received email with score

---

## 🔍 How to Check Vercel Logs

If tests are still failing, check Vercel logs for errors:

1. Go to: **Vercel Dashboard → Your Project**
2. Click: **Deployments** (at top)
3. Click on the latest deployment
4. Click: **Runtime Logs**
5. Search for: `NOTIFICATION` or `EMAIL` or `📧`

**Look for:**
- `✅ Email transporter initialized` - Good sign
- `❌ Email transporter verification failed` - Gmail auth issue
- `📧 Sending email to...` - Shows emails being sent
- `✅ Notification sent to` - Email was sent successfully

---

## 📝 Environment Variable Template

Copy and paste into Vercel:

```
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=https://hamlearningfinale.vercel.app
BACKEND_URL=https://your-api-url.vercel.app
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-key
```

---

## 🎯 After Fixing

Once notifications are working:

1. **Monitor Logs Daily** - Search Vercel logs for errors
2. **Test Monthly** - Send test email to verify still working
3. **Check Spam Folder** - Some emails might go to spam initially
4. **Document Configuration** - Save your Gmail App Password securely

---

## 📞 Still Not Working?

If notifications still aren't working after these steps:

1. **Check Vercel Logs** - Look for error messages
2. **Verify Gmail Account** - Try sending regular email from that account
3. **Regenerate App Password** - Delete and create new one at https://myaccount.google.com/apppasswords
4. **Check Firewall** - Ensure Gmail SMTP (port 587) isn't blocked
5. **Wait for Deployment** - Vercel sometimes takes 5+ minutes to deploy

---

**© 2025 HamLearning LMS**
