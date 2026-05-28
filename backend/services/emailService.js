const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');

// Initialize transporter
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD 
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;

const BRAND_COLOR = '#2d7a4f';
const BRAND_DARK = '#1e5a3a';

/**
 * Email template base styles
 */
const getEmailTemplate = (content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #333;
        background-color: #f5f5f5;
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 0;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header { 
        background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); 
        color: white; 
        padding: 30px; 
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .header p {
        margin: 8px 0 0 0;
        font-size: 14px;
        opacity: 0.9;
      }
      .content { 
        padding: 30px;
      }
      .section {
        margin: 25px 0;
      }
      .activity-card {
        background: #f9fafb;
        padding: 20px;
        border-left: 4px solid ${BRAND_COLOR};
        margin: 20px 0;
        border-radius: 4px;
      }
      .activity-card h3 {
        margin: 0 0 12px 0;
        color: ${BRAND_COLOR};
        font-size: 16px;
      }
      .activity-card p {
        margin: 8px 0;
        color: #555;
        font-size: 14px;
      }
      .label {
        font-weight: 600;
        color: ${BRAND_COLOR};
      }
      .score-display {
        background: ${BRAND_COLOR};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        display: inline-block;
        font-weight: 600;
        margin: 12px 0;
      }
      .button {
        display: inline-block;
        background: ${BRAND_COLOR};
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 16px 0;
        border: none;
        cursor: pointer;
        font-size: 14px;
      }
      .button:hover {
        background: ${BRAND_DARK};
        text-decoration: none;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        color: #999;
        font-size: 12px;
      }
      .divider {
        border: none;
        border-top: 1px solid #e0e0e0;
        margin: 20px 0;
      }
      .cta-section {
        text-align: center;
        margin: 25px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
    </div>
  </body>
  </html>
`;

/**
 * Send email safely with error handling
 */
const sendEmailSafely = async (mailOptions) => {
  if (!transporter) {
    console.log('Email service not configured - skipping email:', mailOptions.subject);
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', mailOptions.to);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - allow operation to continue even if email fails
    return { success: false, error: error.message };
  }
};

/**
 * 1. NEW ACTIVITY POSTED - Notify all students in a class
 */
const notifyNewActivity = async (classId, activityTitle, activityDescription) => {
  try {
    // Get all students enrolled in the class
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('class_id', classId);

    if (enrollError || !enrollments || enrollments.length === 0) {
      console.log('No students to notify for new activity');
      return;
    }

    // Get class details
    const { data: classData } = await supabase
      .from('classes')
      .select('class_name, section')
      .eq('id', classId)
      .single();

    // Get teacher details
    const { data: teacher } = await supabase
      .from('users')
      .select('name')
      .eq('role', 'teacher')
      .single();

    // Send email to each student
    for (const enrollment of enrollments) {
      const { data: student } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) continue;

      const mailContent = `
        <div class="header">
          <h1>📋 HamLearning</h1>
          <p>New Activity Posted</p>
        </div>
        <div class="content">
          <p>Hi ${student.name || 'there'},</p>
          <p>A new activity has been posted in <strong>${classData?.class_name || 'your class'}</strong> (${classData?.section || ''}).</p>
          
          <div class="activity-card">
            <h3>${activityTitle}</h3>
            ${activityDescription ? `<p>${activityDescription.replace(/\n/g, '<br>')}</p>` : ''}
            <p><span class="label">Posted by:</span> ${teacher?.name || 'Your Teacher'}</p>
          </div>

          <p>Please review the activity details and submit before the deadline.</p>
          
          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/classes/${classId}" class="button">View Activity</a>
          </div>
          
          <div class="footer">
            <p>This is an automated email from HamLearning LMS. Please do not reply to this email.</p>
            <p>© 2025 HamLearning LMS. All rights reserved.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
        to: student.email,
        subject: `New Activity: ${activityTitle}`,
        html: getEmailTemplate(mailContent)
      };

      await sendEmailSafely(mailOptions);
    }
  } catch (error) {
    console.error('Error notifying new activity:', error);
  }
};

/**
 * 2. DEADLINE REMINDER - Notify students about upcoming deadlines
 */
const notifyDeadlineReminder = async (taskId, hoursUntilDeadline) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('*, classes:class_id(class_name, section)')
      .eq('id', taskId)
      .single();

    if (!task) return;

    // Get students enrolled in the class
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('class_id', task.class_id);

    if (!enrollments || enrollments.length === 0) return;

    const dueDate = new Date(task.due_date);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    for (const enrollment of enrollments) {
      const { data: student } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) continue;

      const mailContent = `
        <div class="header">
          <h1>⏰ HamLearning</h1>
          <p>Deadline Reminder</p>
        </div>
        <div class="content">
          <p>Hi ${student.name || 'there'},</p>
          <p>This is a reminder that a deadline is approaching!</p>
          
          <div class="activity-card">
            <h3>${task.title}</h3>
            ${task.description ? `<p>${task.description.replace(/\n/g, '<br>')}</p>` : ''}
            <p><span class="label">Class:</span> ${task.classes?.class_name || 'Your Class'}</p>
            <p><span class="label">Due:</span> ${formattedDate}</p>
            <p><span class="label">Time Remaining:</span> ${hoursUntilDeadline} hours</p>
          </div>

          <p style="color: #e74c3c; font-weight: 600;">Make sure to submit your work before the deadline!</p>
          
          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks" class="button">View & Submit</a>
          </div>
          
          <div class="footer">
            <p>This is an automated email from HamLearning LMS. Please do not reply to this email.</p>
            <p>© 2025 HamLearning LMS. All rights reserved.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
        to: student.email,
        subject: `⏰ Deadline Reminder: ${task.title}`,
        html: getEmailTemplate(mailContent)
      };

      await sendEmailSafely(mailOptions);
    }
  } catch (error) {
    console.error('Error sending deadline reminder:', error);
  }
};

/**
 * 3. GRADING NOTIFICATION - Notify student when activity is graded
 */
const notifyActivityGraded = async (submissionId, studentId, taskId, score, feedback, maxScore) => {
  try {
    const { data: student } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', studentId)
      .single();

    if (!student || !student.email) return;

    const { data: task } = await supabase
      .from('tasks')
      .select('title, description, classes:class_id(class_name)')
      .eq('id', taskId)
      .single();

    if (!task) return;

    const scorePercentage = maxScore ? Math.round((score / maxScore) * 100) : null;

    const mailContent = `
      <div class="header">
        <h1>✅ HamLearning</h1>
        <p>Activity Graded</p>
      </div>
      <div class="content">
        <p>Hi ${student.name || 'there'},</p>
        <p>Your submission for the following activity has been graded:</p>
        
        <div class="activity-card">
          <h3>${task.title}</h3>
          <p><span class="label">Class:</span> ${task.classes?.class_name || 'Your Class'}</p>
        </div>

        <div style="text-align: center;">
          <div class="score-display">
            ${score !== null ? `Score: ${score}${maxScore ? `/${maxScore}` : ''}` : 'Not Graded'}
            ${scorePercentage !== null ? ` (${scorePercentage}%)` : ''}
          </div>
        </div>

        ${feedback ? `
          <div class="section">
            <p><span class="label">Feedback from Instructor:</span></p>
            <div style="background: #f9fafb; padding: 16px; border-radius: 4px; margin-top: 8px;">
              <p>${feedback.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        ` : ''}

        <p>Review your submission and feedback in detail by clicking the button below.</p>
        
        <div class="cta-section">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks" class="button">View Detailed Feedback</a>
        </div>
        
        <div class="footer">
          <p>This is an automated email from HamLearning LMS. Please do not reply to this email.</p>
          <p>© 2025 HamLearning LMS. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
      to: student.email,
      subject: `✅ Your Activity Has Been Graded: ${task.title}`,
      html: getEmailTemplate(mailContent)
    };

    await sendEmailSafely(mailOptions);
  } catch (error) {
    console.error('Error notifying graded activity:', error);
  }
};

/**
 * 4. SUBMISSION NOTIFICATION - Notify teacher when student submits
 */
const notifySubmissionReceived = async (taskId, studentId, teacherId, fileName, submissionText) => {
  try {
    const { data: teacher } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', teacherId)
      .single();

    if (!teacher || !teacher.email) return;

    const { data: student } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', studentId)
      .single();

    const { data: task } = await supabase
      .from('tasks')
      .select('title, classes:class_id(class_name)')
      .eq('id', taskId)
      .single();

    if (!task) return;

    const mailContent = `
      <div class="header">
        <h1>📤 HamLearning</h1>
        <p>New Submission Received</p>
      </div>
      <div class="content">
        <p>Hi ${teacher.name || 'there'},</p>
        <p>A student has submitted an activity for review.</p>
        
        <div class="activity-card">
          <h3>${task.title}</h3>
          <p><span class="label">Class:</span> ${task.classes?.class_name || 'Your Class'}</p>
          <p><span class="label">Student:</span> ${student?.name || 'Unknown Student'}</p>
          <p><span class="label">Email:</span> ${student?.email || 'N/A'}</p>
          ${fileName ? `<p><span class="label">Attachment:</span> ${fileName}</p>` : ''}
          ${submissionText ? `<p><span class="label">Submission Text:</span></p><p style="background: #f9fafb; padding: 12px; border-radius: 4px; margin-top: 8px;">${submissionText.substring(0, 300)}${submissionText.length > 300 ? '...' : ''}</p>` : ''}
        </div>

        <p>Review the submission and provide grades and feedback.</p>
        
        <div class="cta-section">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/submissions" class="button">Review Submission</a>
        </div>
        
        <div class="footer">
          <p>This is an automated email from HamLearning LMS. Please do not reply to this email.</p>
          <p>© 2025 HamLearning LMS. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'HamLearning LMS <noreply@hamlearning.com>',
      to: teacher.email,
      subject: `📤 New Submission: ${student?.name || 'A Student'} - ${task.title}`,
      html: getEmailTemplate(mailContent)
    };

    await sendEmailSafely(mailOptions);
  } catch (error) {
    console.error('Error notifying submission received:', error);
  }
};

module.exports = {
  notifyNewActivity,
  notifyDeadlineReminder,
  notifyActivityGraded,
  notifySubmissionReceived,
  sendEmailSafely,
  getEmailTemplate
};
