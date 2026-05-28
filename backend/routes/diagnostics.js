const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

/**
 * DIAGNOSTIC ENDPOINTS - For testing and debugging email service
 * These are NOT for production use, only for development/troubleshooting
 */

// SIMPLE HEALTH CHECK - no dependencies
router.get('/health', (req, res) => {
  console.log('📡 Diagnostics health check called');
  res.json({
    status: 'ok',
    message: 'Diagnostics endpoint is working'
  });
});

/**
 * Test email service by sending a test email
 * POST /api/diagnostics/test-email
 * Body: { to: 'test@example.com' }
 */
router.post('/test-email', async (req, res) => {
  try {
    console.log('\n🔍 === TESTING EMAIL SERVICE ===');
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    console.log('EMAIL_USER:', emailUser ? '✓ Set to: ' + emailUser : '✗ Not set');
    console.log('EMAIL_PASSWORD:', emailPassword ? '✓ Set (length: ' + emailPassword.length + ')' : '✗ Not set');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (will use default)');

    const { to } = req.body;

    if (!to) {
      console.warn('⚠️  No "to" field provided in request');
      return res.status(400).json({ 
        error: 'Missing "to" field in request body',
        example: { to: 'test@example.com' }
      });
    }

    console.log(`📧 Attempting to send test email to: ${to}`);

    // Create transporter
    if (!emailUser || !emailPassword) {
      console.error('❌ Email credentials not configured');
      return res.status(500).json({
        status: 'failed',
        message: '❌ Email service not configured',
        details: {
          emailUserSet: !!emailUser,
          emailPasswordSet: !!emailPassword
        },
        troubleshooting: [
          'Set EMAIL_USER environment variable in Vercel',
          'Set EMAIL_PASSWORD environment variable in Vercel (use Gmail App Password)',
          'Make sure these are in Vercel Environment Variables, not just .env'
        ]
      });
    }

    const testTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    console.log('🔧 Testing transporter connection...');
    
    // Verify connection
    testTransporter.verify(async (error, success) => {
      if (error) {
        console.error('❌ Transporter verification failed:', error.message);
        return res.status(500).json({
          status: 'failed',
          message: '❌ Failed to connect to Gmail SMTP',
          error: error.message,
          troubleshooting: [
            'Verify EMAIL_USER is a Gmail address (e.g., your.email@gmail.com)',
            'Verify EMAIL_PASSWORD is a Gmail App Password (not your regular password)',
            'To get App Password: Go to myaccount.google.com/apppasswords',
            'Make sure 2-factor authentication is enabled on your Gmail account'
          ]
        });
      }

      console.log('✅ Transporter verified - SMTP connection successful');

      const mailOptions = {
        from: emailUser,
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

      try {
        console.log('📤 Sending test email...');
        const result = await testTransporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', result.messageId);
        
        return res.json({
          status: 'success',
          message: `✅ Test email sent successfully to ${to}`,
          details: {
            messageId: result.messageId,
            from: emailUser,
            to: to,
            subject: mailOptions.subject,
            sentAt: new Date().toISOString()
          }
        });
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError.message);
        return res.status(500).json({
          status: 'failed',
          message: '❌ Failed to send test email',
          error: emailError.message,
          troubleshooting: [
            'Check Vercel logs for detailed error message',
            'Verify EMAIL_PASSWORD is a Gmail App Password',
            'Try sending again in a few seconds',
            'Check if email went to spam folder'
          ]
        });
      }
    });

  } catch (error) {
    console.error('❌ Error in test-email endpoint:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Error testing email service',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get email service configuration status
 * GET /api/diagnostics/email-status
 */
router.get('/email-status', (req, res) => {
  try {
    console.log('\n🔍 === EMAIL SERVICE STATUS ===');
    
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const frontendUrl = process.env.FRONTEND_URL;
    const backendUrl = process.env.BACKEND_URL;

    const status = {
      timestamp: new Date().toISOString(),
      email_service: {
        configured: !!(emailUser && emailPassword),
        email_user: emailUser ? '✓ Set to: ' + emailUser : '✗ Not set',
        email_password: emailPassword ? '✓ Set (length: ' + emailPassword.length + ' chars)' : '✗ Not set',
        service: 'Gmail SMTP',
        recommendations: []
      },
      urls: {
        frontend: frontendUrl || 'Not set (will use http://localhost:3000)',
        backend: backendUrl || 'Not set (will use http://localhost:5000)'
      }
    };

    if (!emailUser) {
      status.email_service.recommendations.push('❌ Set EMAIL_USER environment variable in Vercel');
    }
    
    if (!emailPassword) {
      status.email_service.recommendations.push('❌ Set EMAIL_PASSWORD environment variable in Vercel (use Gmail App Password, NOT regular password)');
    }

    if (!frontendUrl) {
      status.email_service.recommendations.push('⚠️  Set FRONTEND_URL for email action buttons (optional but recommended)');
    }

    if (!backendUrl) {
      status.email_service.recommendations.push('⚠️  Set BACKEND_URL for file URLs in emails (optional but recommended)');
    }

    if (emailUser && emailPassword) {
      status.email_service.recommendations.push('✅ All required email variables are set!');
    }

    console.log(JSON.stringify(status, null, 2));

    return res.json(status);
  } catch (error) {
    console.error('❌ Error in email-status:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Error checking email status',
      error: error.message
    });
  }
});

/**
 * Get environment variable summary
 * GET /api/diagnostics/env-summary
 */
router.get('/env-summary', (req, res) => {
  try {
    console.log('\n🔍 === ENVIRONMENT VARIABLES SUMMARY ===');
    
    const summary = {
      'EMAIL_USER': process.env.EMAIL_USER ? '✓ ' + process.env.EMAIL_USER : '✗ Missing',
      'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '✓ Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : '✗ Missing',
      'FRONTEND_URL': process.env.FRONTEND_URL ? '✓ ' + process.env.FRONTEND_URL : '✗ Not set',
      'BACKEND_URL': process.env.BACKEND_URL ? '✓ ' + process.env.BACKEND_URL : '✗ Not set',
      'NODE_ENV': process.env.NODE_ENV || 'development',
      'PORT': process.env.PORT || 5000,
      'SUPABASE_URL': process.env.SUPABASE_URL ? '✓ Configured' : '✗ Missing',
      'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'
    };

    console.log(JSON.stringify(summary, null, 2));

    return res.json(summary);
  } catch (error) {
    console.error('❌ Error in env-summary:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Error getting environment summary',
      error: error.message
    });
  }
});

module.exports = router;
