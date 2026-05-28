# 🚀 Resend Email Notifications Setup (Privacy-Friendly)

## ✅ Why Resend Instead of Gmail?

| Feature | Gmail Approach | Resend Approach |
|---------|---|---|
| **Privacy** | ❌ Exposes personal account | ✅ No personal credentials |
| **Security** | ❌ Password in environment | ✅ Anonymous API key |
| **Maintenance** | ❌ Account-dependent | ✅ Scalable service |
| **Cost** | ❌ Rate limited | ✅ Free tier (100/day) |
| **Setup Time** | ⏱️ 10+ minutes | ⏱️ **5 minutes** |

---

## 📋 5-Minute Setup Guide

### Step 1: Create Resend Account (1 min)
1. Open: https://resend.com
2. Click **"Sign Up"**
3. Enter your email (any email - doesn't matter)
4. Create password
5. Click **"Create Account"**

✅ **Done:** You now have a Resend account

---

### Step 2: Get API Key (1 min)
1. Go to: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `HamLearning` (or any name)
4. Copy the key (looks like: `re_xxx...`)

✅ **Done:** You have your API key

---

### Step 3: Add to Vercel (2 min)
1. Go to: **Vercel Dashboard**
   - https://vercel.com/dashboard
2. Select your project: **HammyBack**
3. Click **Settings**
4. Click **Environment Variables**
5. Click **Add New**

**Add this variable:**
```
Name:  RESEND_API_KEY
Value: re_xxxxxxxxxxxxxxxxxxxx  (paste your API key)
```

6. Click **"Save"**
7. **Redeploy** by going to Deployments and clicking **Redeploy**

✅ **Done:** Notifications are now active!

---

### Step 4: Test Notifications (1 min)

Use the **Diagnostic Endpoint** to verify:

```bash
# Test email delivery
curl -X POST https://your-vercel-domain.com/api/diagnostics/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check configuration
curl https://your-vercel-domain.com/api/diagnostics/email-status
```

**Expected Response:**
```json
{
  "status": "configured",
  "sender": "noreply@hamlearning.edu",
  "emailService": "Resend"
}
```

✅ **Done:** Notifications are working!

---

## 🎯 What Gets Notified?

### 1. **Student Submits Work**
   - 📧 Teacher gets email with student name & file name
   - Status: ✅ Automatic

### 2. **Teacher Grades Work**
   - 📧 Student gets score, feedback, and grade
   - Status: ✅ Automatic

### 3. **New Assignment Created**
   - 📧 All class students get assignment details
   - Status: ✅ Automatic

### 4. **24-Hour Deadline Reminder**
   - 📧 Students get reminder the day before deadline
   - Status: ✅ Automatic (hourly job)

### 5. **Announcements**
   - 📧 Students notified of teacher announcements
   - Status: ✅ Automatic

---

## 🧪 Manual Testing

### Test via Frontend

**As a Teacher:**
1. Log in as teacher
2. Create a new assignment
3. Check test student's email
4. Should receive: "New Task: [Title]"

**As a Student:**
1. Submit work
2. Check teacher's email
3. Should receive: "New Submission from [Student Name]"

**As a Teacher (Grading):**
1. Grade the submission
2. Check student's email
3. Should receive: "Grade: X/100"

---

## ⚙️ Configuration

### Environment Variable
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### Email Sender
- From: `HamLearning LMS <noreply@hamlearning.edu>`
- Service: Resend (free tier)

### Fallback Behavior
If API key not set:
- System logs warning
- Notifications are skipped (non-blocking)
- LMS continues to work normally

---

## 🔍 Troubleshooting

### Issue: "Resend not configured"
**Solution:** Check RESEND_API_KEY in Vercel > Settings > Environment Variables

### Issue: Emails not arriving
**Solution:** 
1. Check spam folder
2. Verify recipient email is correct in Supabase `users` table
3. Run diagnostic endpoint:
   ```bash
   curl https://your-domain.com/api/diagnostics/email-status
   ```

### Issue: Free tier limit reached (100/day)
**Solution:** Upgrade Resend account for higher limits

---

## ✨ Features

- ✅ **No personal Gmail needed** - Privacy preserved
- ✅ **Automatic** - Runs seamlessly in Vercel
- ✅ **Reliable** - Professional email service
- ✅ **Free** - 100 emails/day included
- ✅ **Scalable** - Easy to increase limits
- ✅ **Branded** - Professional HamLearning emails
- ✅ **Educational** - Perfect for schools/LMS

---

## 📞 Support

**Resend Documentation:** https://resend.com/docs
**Resend Dashboard:** https://resend.com

---

**Setup Date:** May 29, 2026  
**Status:** Production Ready ✅
