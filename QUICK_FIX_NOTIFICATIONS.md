# ⚡ QUICK FIX: Get Notifications Working in 5 Minutes

## 🎯 The Problem
Code is deployed but **EMAIL_USER and EMAIL_PASSWORD are missing from Vercel**

## ✅ The Solution (Copy-Paste Steps)

### Step 1️⃣: Get Gmail App Password (2 min)

1. Go to: https://myaccount.google.com/apppasswords
2. Select: **Mail** and **Windows Computer**
3. Copy the 16 characters (example: `nzwf kdxc asdf asdf`)
4. Keep this window open

### Step 2️⃣: Add to Vercel (2 min)

1. Go to: https://vercel.com/hamlearning/hamlearningfinale (replace with YOUR project name)
2. Click: **Settings**
3. Click: **Environment Variables** (left menu)
4. Click: **Add New**

**Add EMAIL_USER:**
```
Name: EMAIL_USER
Value: your.email@gmail.com  (the Gmail you want to send from)
Environments: Check all 3 (Production, Preview, Development)
Click: Save
```

**Add EMAIL_PASSWORD:**
```
Name: EMAIL_PASSWORD
Value: nzwf kdxc asdf asdf  (the 16 characters from Step 1)
Environments: Check all 3 (Production, Preview, Development)
Click: Save
```

**Add FRONTEND_URL** (optional but recommended):
```
Name: FRONTEND_URL
Value: https://hamlearningfinale.vercel.app
Environments: Check all 3
Click: Save
```

### Step 3️⃣: Wait for Redeploy (1 min)

- Vercel automatically redeploys (watch the **Deployments** tab)
- Wait for blue checkmark = deployed ✅

---

## 🧪 Test It Works

Open browser and go to:

```
https://hamlearningfinale.vercel.app/api/diagnostics/email-status
```

**You should see:**
```json
{
  "email_service": {
    "configured": true,
    "email_user": "✓ Set to: your.email@gmail.com",
    "email_password": "✓ Set (length: 16)"
  }
}
```

If you see `"configured": false` → Go back to Step 2 and check EMAIL_USER/PASSWORD are saved

---

## ✨ That's It!

Now:
- ✅ Teachers create assignment → Students get email
- ✅ Students submit work → Teacher gets email  
- ✅ Teachers grade → Students get email with score

---

## 🚨 If Still Not Working

### Test Email Sending

```
POST https://hamlearningfinale.vercel.app/api/diagnostics/test-email
Content-Type: application/json

{
  "to": "your.email@gmail.com"
}
```

Should receive email in 30 seconds

### Check Vercel Logs

1. Vercel Dashboard → Deployments → Latest → Runtime Logs
2. Search for: `NOTIFICATION` or `EMAIL` or `configured`
3. Look for errors

### Common Fixes

| Issue | Fix |
|-------|-----|
| "app password" error | Use 16-char password, not regular Gmail password |
| "invalid credentials" | Copy-paste password again, check for spaces |
| Nothing happens | Reload page, wait 3 more minutes for deployment |
| Emails go to spam | Check spam folder, mark "Not Spam" |

---

**That's it! Notifications should now be working for your entire LMS! 🎉**
