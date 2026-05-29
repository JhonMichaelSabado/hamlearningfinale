const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const supabase = require('../config/supabase');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Configure email transporter (Gmail example)
// You'll need to set up environment variables for these
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Log email configuration status
console.log('===== PASSWORD RESET EMAIL CONFIG =====');
console.log('EMAIL_USER configured:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD configured:', !!process.env.EMAIL_PASSWORD);
console.log('=======================================\n');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Email received:', req.body.email);
    
    const { email } = req.body;

    if (!email) {
      console.warn('❌ No email provided in request');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`📧 Looking up user with email: ${email}`);

    // Check if user exists
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log(`⚠️  No user found with email: ${email}`);
      // Return success even if user doesn't exist (security best practice)
      return res.status(200).json({ 
        message: 'If an account exists with this email, a password reset code has been sent.' 
      });
    }

    const user = users[0];
    console.log(`✓ User found: ${user.name} (ID: ${user.id})`);

    // Generate a 5-digit numeric reset code
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    console.log(`🔐 Generated reset code: ${resetCode}`);
    
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save code to database (stored in reset_token)
    console.log(`💾 Saving reset code to database for user ${user.id}`);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetCode,
        reset_token_expires: resetTokenExpires.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw updateError;
    }

    console.log('✓ Reset code saved to database');

    // Send email containing the 5-digit code
    const mailOptions = {
      from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
      to: email,
      subject: 'Your HamLearning Password Reset Code',
      html: `
        <p>Hello ${user.name || 'there'},</p>
        <p>We received a request to reset your HamLearning password. Use the 5-digit code below to reset your password. This code will expire in 1 hour.</p>
        <h2 style="letter-spacing:6px;">${resetCode}</h2>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>© HamLearning</p>
      `
    };

    try {
      console.log(`📧 Attempting to send reset code email to ${email}...`);
      await transporter.sendMail(mailOptions);
      console.log(`✅ Reset code email sent successfully to ${email}`);
    } catch (emailError) {
      console.warn(`⚠️  Email failed to send (but code was saved to DB): ${emailError.message}`);
      console.warn('Email will not block the reset process - code is available in DB');
      console.log(`Code for manual testing: ${resetCode}`);
    }

    res.status(200).json({ 
      message: 'If an account exists with this email, a password reset code has been sent.' 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Error processing request. Please try again.' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Check if token is expired
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password. Please try again.' });
  }
});

// Reset password using email + 5-digit code
router.post('/reset-password-with-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by email and matching code
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or code' });
    }

    const user = users[0];

    if (!user.reset_token || user.reset_token !== String(code)) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error('Reset with code error:', error);
    res.status(500).json({ message: 'Error resetting password. Please try again.' });
  }
});

// Verify reset token (check if valid before showing reset form)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(400).json({ valid: false, message: 'Invalid reset token' });
    }

    const user = users[0];

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Reset token has expired' });
    }

    res.status(200).json({ valid: true });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ valid: false, message: 'Error verifying token' });
  }
});

// Change password for logged-in users (including Google users setting first password)
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user details
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // If user has a password (email signup or previously set), verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }
    // If Google user setting password for first time, no current password needed

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.status(200).json({ 
      message: user.password 
        ? 'Password changed successfully' 
        : 'Password set successfully. You can now log in with email and password.' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password. Please try again.' });
  }
});

module.exports = router;
