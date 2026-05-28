const express = require('express');
const { sendEmailSafely } = require('../services/emailService');
const router = express.Router();

/**
 * DIAGNOSTIC ENDPOINTS - For testing and debugging email service
 * These are NOT for production use, only for development/troubleshooting
 */

/**
 * Test email service by sending a test email
 * POST /api/diagnostics/test-email
 * Body: { to: 'test@example.com' }
 */
router.post('/test-email', async (req, res) => {
  try {
    console.log('\n=== TESTING EMAIL SERVICE ===');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (will use default)');

    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ 
        error: 'Missing "to" field in request body',
        example: { to: 'test@example.com' }
      });
    }

    console.log(`\n📧 Sending test email to: ${to}`);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
      to: to,
      subject: '🧪 HamLearning Email Service Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 20px; }
            .success { color: #27ae60; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 HamLearning Email Service Test</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p><span class="success">✓ If you're reading this, the email service is working correctly!</span></p>
              <p>This is a test email from the HamLearning LMS notification system.</p>
              <hr>
              <p><small>Sent at: ${new Date().toISOString()}</small></p>
              <p><small>© 2025 HamLearning LMS</small></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await sendEmailSafely(mailOptions);

    if (result.success) {
      return res.json({
        status: 'success',
        message: `✅ Test email sent successfully to ${to}`,
        details: {
          messageId: result.messageId,
          from: mailOptions.from,
          to: to,
          subject: mailOptions.subject
        }
      });
    } else {
      return res.status(500).json({
        status: 'failed',
        message: '❌ Failed to send test email',
        error: result.error,
        troubleshooting: [
          'Verify EMAIL_USER is set correctly',
          'Verify EMAIL_PASSWORD is a Gmail App Password (not regular password)',
          'Ensure Gmail account has 2-factor authentication enabled',
          'Check if email went to spam folder',
          'Try again in a few seconds'
        ]
      });
    }
  } catch (error) {
    console.error('❌ Error in test-email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error testing email service',
      error: error.message
    });
  }
});

/**
 * Get email service configuration status
 * GET /api/diagnostics/email-status
 */
router.get('/email-status', (req, res) => {
  console.log('\n=== EMAIL SERVICE STATUS ===');
  
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl = process.env.BACKEND_URL;

  const status = {
    timestamp: new Date().toISOString(),
    email_service: {
      configured: !!(emailUser && emailPassword),
      email_user: emailUser ? '✓ Set' : '✗ Not set',
      email_password: emailPassword ? '✓ Set' : '✗ Not set',
      service: 'Gmail SMTP',
      recommendations: []
    },
    urls: {
      frontend: frontendUrl || 'Not set (will use http://localhost:3000)',
      backend: backendUrl || 'Not set (will use http://localhost:5000)'
    }
  };

  if (!emailUser) {
    status.email_service.recommendations.push('Set EMAIL_USER environment variable');
  }
  
  if (!emailPassword) {
    status.email_service.recommendations.push('Set EMAIL_PASSWORD environment variable (use Gmail App Password, not regular password)');
  }

  if (!frontendUrl) {
    status.email_service.recommendations.push('Set FRONTEND_URL for email action buttons');
  }

  if (!backendUrl) {
    status.email_service.recommendations.push('Set BACKEND_URL for file URLs in emails');
  }

  console.log(JSON.stringify(status, null, 2));

  res.json(status);
});

/**
 * Get environment variable summary
 * GET /api/diagnostics/env-summary
 */
router.get('/env-summary', (req, res) => {
  console.log('\n=== ENVIRONMENT VARIABLES SUMMARY ===');
  
  const summary = {
    'EMAIL_USER': process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing',
    'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '✓ Configured' : '✗ Missing',
    'FRONTEND_URL': process.env.FRONTEND_URL ? '✓ ' + process.env.FRONTEND_URL : '✗ Not set',
    'BACKEND_URL': process.env.BACKEND_URL ? '✓ ' + process.env.BACKEND_URL : '✗ Not set',
    'NODE_ENV': process.env.NODE_ENV || 'development',
    'PORT': process.env.PORT || 5000,
    'SUPABASE_URL': process.env.SUPABASE_URL ? '✓ Configured' : '✗ Missing',
    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'
  };

  console.log(JSON.stringify(summary, null, 2));

  res.json(summary);
});

module.exports = router;
