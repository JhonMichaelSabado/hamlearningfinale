const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const supabase = require('../config/supabase');
const router = express.Router();

// Google OAuth login endpoint
// Mounted in server.js as /api/google. Full path is /api/google/google
router.post('/google', async (req, res) => {
  try {
    console.log('🔵 Google auth route called');
    const { token } = req.body;

    if (!token) {
      console.error('❌ No token provided in request');
      return res.status(400).json({ message: 'Google token required' });
    }

    console.log('🔷 Verifying Google token...');
    // Verify Google token and get user info
    let response;
    try {
      response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (!response.ok) {
        throw new Error(`Google API returned status ${response.status}`);
      }
    } catch (fetchError) {
      console.error('❌ Error fetching Google token info:', fetchError.message);
      return res.status(401).json({ message: 'Failed to verify Google token' });
    }

    let googleUser;
    try {
      googleUser = await response.json();
    } catch (parseError) {
      console.error('❌ Error parsing Google response:', parseError.message);
      return res.status(401).json({ message: 'Invalid Google token response' });
    }

    if (googleUser.error) {
      console.error('❌ Google token validation failed:', googleUser.error_description);
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture } = googleUser;
    console.log('✅ Google user verified:', email);

    if (!email) {
      console.error('❌ No email in Google token');
      return res.status(400).json({ message: 'Email not available from Google account' });
    }

    // Check if user exists
    console.log('🔷 Checking for existing user...');
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('❌ Supabase select error:', selectError);
      return res.status(500).json({ message: 'Database error' });
    }

    let user;

    if (existingUser) {
      console.log('✅ Existing user found, updating profile picture');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ profile_picture: picture })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return res.status(500).json({ message: 'Error updating user profile' });
      }
      
      user = updatedUser || existingUser;
    } else {
      console.log('✅ New user, creating account');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            name,
            profile_picture: picture,
            auth_provider: 'google',
            profile_completed: false,
            role: 'student'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
        return res.status(500).json({ message: 'Error creating user account' });
      }

      user = newUser;
    }

    if (!user) {
      console.error('❌ User object is null after create/update');
      return res.status(500).json({ message: 'Error processing user' });
    }

    // Generate JWT token
    console.log('🔷 Generating JWT token...');
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    console.log('✅ Login successful for user:', user.email);
    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profile_completed,
        profilePicture: user.profile_picture,
        authProvider: 'google',
        hasPassword: !!user.password,
        major: user.major,
        academicYear: user.academic_year,
        targetGPA: user.target_gpa,
        department: user.department,
        subjects: user.subjects
      }
    });
  } catch (error) {
    console.error('❌ UNCAUGHT Google auth error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred' 
    });
  }
});

// Complete profile for Google users
router.post('/complete-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const { role, major, academicYear, targetGPA, department, subjects } = req.body;

    const updateData = {
      role: role || 'student',
      profile_completed: true
    };

    if (role === 'student') {
      updateData.major = major;
      updateData.academic_year = academicYear;
      updateData.target_gpa = targetGPA;
    } else if (role === 'teacher') {
      updateData.major = major;
      updateData.department = department;
      updateData.subjects = subjects;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', decoded.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ message: 'Error updating profile' });
    }

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profileCompleted: updatedUser.profile_completed,
        profilePicture: updatedUser.profile_picture,
        authProvider: 'google',
        hasPassword: !!updatedUser.password,
        major: updatedUser.major,
        academicYear: updatedUser.academic_year,
        targetGPA: updatedUser.target_gpa,
        department: updatedUser.department,
        subjects: updatedUser.subjects
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// IMPORTANT: This line was missing!
module.exports = router;
