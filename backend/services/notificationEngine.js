/**
 * NOTIFICATION ENGINE - Simple Automated Email System
 * Uses Nodemailer + Gmail for reliable automated notifications
 * Environment variables (encrypted in Vercel) - NO privacy violation
 * Works seamlessly with Vercel serverless deployment
 */

const nodemailer = require('nodemailer');
const supabaseAdmin = require('../config/supabase-admin'); // Use service role for backend access

// ==================== EMAIL SERVICE SETUP ====================
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

console.log('🔧 [NOTIFICATION ENGINE] Initialization check:');
console.log('   EMAIL_USER defined:', !!EMAIL_USER);
console.log('   EMAIL_PASSWORD defined:', !!EMAIL_PASSWORD);
console.log('   EMAIL_USER value:', EMAIL_USER ? `${EMAIL_USER.substring(0, 5)}***` : 'undefined');

let transporter = null;

if (EMAIL_USER && EMAIL_PASSWORD) {
  // Use explicit host/port for Gmail instead of "service: gmail"
  // This allows us to use port 587 (TLS) instead of 465 (SSL) which Vercel may block
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS instead of SSL
    requireTLS: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    },
    connectionTimeout: 10000,
    socketTimeout: 10000
  });
  console.log('📧 [NOTIFICATION ENGINE] Email service initialized');
  console.log('   From:', EMAIL_USER);
  console.log('   SMTP Host: smtp.gmail.com');
  console.log('   Port: 587 (TLS)');
  
  // Test the transporter immediately
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ [NOTIFICATION ENGINE] Transporter verification FAILED:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
    } else {
      console.log('✅ [NOTIFICATION ENGINE] Transporter verification SUCCESS - Ready to send emails!');
    }
  });
} else {
  console.warn('⚠️  [NOTIFICATION ENGINE] Email credentials NOT configured');
  console.warn('   Add EMAIL_USER and EMAIL_PASSWORD to Vercel environment variables');
}

const BRAND_COLOR = '#2d7a4f';
const BRAND_DARK = '#1e5a3a';
const SENDER_NAME = 'HamLearning LMS';

/**
 * Send email notification safely using Nodemailer
 * Automated: No manual intervention needed
 * Secure: Credentials stored in encrypted environment variables
 */
const sendNotification = async (to, subject, htmlContent) => {
  console.log(`\n[SEND_NOTIFICATION_START] Recipient: ${to}`);
  
  if (!transporter) {
    console.warn('⚠️  Email service not configured - notification skipped');
    return { success: false };
  }

  if (!to) {
    console.warn('⚠️  Cannot send notification - no recipient');
    return { success: false };
  }

  try {
    console.log(`📧 [SENDMAIL] Attempting to send email...`);
    console.log(`   Subject: "${subject}"`);
    console.log(`   To: ${to}`);
    console.log(`   From: ${EMAIL_USER}`);
    console.log(`   HTML Length: ${htmlContent.length} chars`);
    console.log(`   Calling transporter.sendMail()...`);
    
    const result = await transporter.sendMail({
      from: `${SENDER_NAME} <${EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });

    console.log(`\n✅ [SENDMAIL_SUCCESS] Email delivered!`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${JSON.stringify(result)}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`\n❌ [SENDMAIL_ERROR] Failed to send email to ${to}`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Command: ${error.command}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Stack Trace: ${error.stack}`);
    console.error(`   Full Error:`, JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

/**
 * Template: Email header with HamLearning branding
 */
const getEmailHeader = (title, subtitle) => `
  <div style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${title}</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">${subtitle}</p>
  </div>
`;

/**
 * Template: Email footer
 */
const getEmailFooter = () => `
  <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
    <p>© 2025 HamLearning LMS. Automated notification.</p>
  </div>
`;

/**
 * NOTIFICATION 1: STUDENT SUBMISSION RECEIVED
 * Triggered when: Student submits work for a task
 * Recipient: Teacher of the class
 */
const notifyTeacherOfSubmission = async (taskId, studentId, studentName, fileName) => {
  try {
    console.log(`📧 [NOTIFY TEACHER] Task submission from ${studentName}`);

    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id, title, class_id, teacher_id')
      .eq('id', taskId)
      .single();

    if (!task || !task.teacher_id) {
      console.warn('⚠️  Task or teacher not found');
      return;
    }

    // Get teacher email
    const { data: teacher } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', task.teacher_id)
      .single();

    if (!teacher || !teacher.email) {
      console.warn('⚠️  Teacher email not found');
      return;
    }

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/submissions`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .activity-card { background: #f9fafb; padding: 20px; border-left: 4px solid ${BRAND_COLOR}; margin: 20px 0; }
          .activity-card h3 { margin: 0 0 12px 0; color: ${BRAND_COLOR}; }
          .label { font-weight: 600; color: ${BRAND_COLOR}; }
          .button { display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${getEmailHeader('📬 New Submission', 'Student submitted work')}
          <div class="content">
            <p>Hi ${teacher.name},</p>
            <p>A student has submitted work for your assignment.</p>
            
            <div class="activity-card">
              <h3>📝 ${task.title}</h3>
              <p><span class="label">Student:</span> ${studentName}</p>
              ${fileName ? `<p><span class="label">File:</span> ${fileName}</p>` : ''}
              <p><span class="label">Time:</span> ${new Date().toLocaleString()}</p>
            </div>

            <p>Review the submission and provide feedback to your student.</p>
            <a href="${dashboardUrl}" class="button">View Submission</a>
          </div>
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    await sendNotification(teacher.email, `📬 New Submission: ${task.title}`, htmlContent);
  } catch (error) {
    console.error('❌ Error in notifyTeacherOfSubmission:', error.message);
  }
};

/**
 * NOTIFICATION 2: WORK GRADED
 * Triggered when: Teacher grades a submission
 * Recipient: Student who submitted the work
 */
const notifyStudentOfGrade = async (submissionId, studentId, taskId, score, maxScore, feedback) => {
  try {
    console.log(`📧 [NOTIFY STUDENT] Work graded - Score: ${score}/${maxScore}`);

    // Get student email
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', studentId)
      .single();

    if (!student || !student.email) {
      console.warn('⚠️  Student email not found');
      return;
    }

    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('title, class_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      console.warn('⚠️  Task not found');
      return;
    }

    const scorePercentage = maxScore ? Math.round((score / maxScore) * 100) : null;
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/grades`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .score-box { background: #f0f9f7; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .score-box h3 { margin: 0 0 10px 0; color: ${BRAND_COLOR}; }
          .score-value { font-size: 28px; font-weight: 700; color: ${BRAND_COLOR}; }
          .label { font-weight: 600; color: ${BRAND_COLOR}; }
          .feedback-box { background: #fff9e6; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .button { display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          ${getEmailHeader('✅ Work Graded', 'Your submission has been evaluated')}
          <div class="content">
            <p>Hi ${student.name},</p>
            <p>Great news! Your work for <strong>${task.title}</strong> has been graded.</p>
            
            <div class="score-box">
              <h3>Your Score</h3>
              <p style="margin: 10px 0;"><span class="score-value">${score}/${maxScore}</span></p>
              <p style="margin: 10px 0;"><span class="label">Percentage:</span> ${scorePercentage}%</p>
            </div>

            ${feedback ? `
              <div class="feedback-box">
                <h3 style="margin: 0 0 10px 0; color: #d97706;">📝 Feedback</h3>
                <p style="margin: 0;">${feedback}</p>
              </div>
            ` : ''}

            <p>View all your grades and feedback in the dashboard.</p>
            <a href="${dashboardUrl}" class="button">View Grades</a>
          </div>
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    await sendNotification(student.email, `✅ Work Graded: ${task.title}`, htmlContent);
  } catch (error) {
    console.error('❌ Error in notifyStudentOfGrade:', error.message);
  }
};

/**
 * NOTIFICATION 3: NEW TASK/ASSIGNMENT POSTED
 * Triggered when: Teacher creates a new task for a class
 * Recipient: All students enrolled in that class
 */
const notifyStudentsOfNewTask = async (taskId, classId, taskTitle, taskDescription, dueDate) => {
  try {
    console.log(`📧 [NOTIFY CLASS] New task: ${taskTitle}`);

    // Get class details
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('class_name, instructor_id')
      .eq('id', classId)
      .single();

    if (!classData) {
      console.warn('⚠️  Class not found');
      return;
    }

    // Get all enrolled students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .eq('class_id', classId);

    if (!enrollments || enrollments.length === 0) {
      console.log('   No students to notify');
      return;
    }

    console.log(`   Notifying ${enrollments.length} students`);

    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Not specified';

    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks`;

    // Send email to each student
    for (const enrollment of enrollments) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) continue;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .task-card { background: #f9fafb; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .label { font-weight: 600; color: ${BRAND_COLOR}; }
            .button { display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .highlight { background: #fffbea; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getEmailHeader('📚 New Assignment', 'A new task has been posted')}
            <div class="content">
              <p>Hi ${student.name},</p>
              <p>A new assignment has been posted in <strong>${classData.class_name}</strong>.</p>
              
              <div class="task-card">
                <h3 style="margin: 0 0 12px 0; color: ${BRAND_COLOR};">📝 ${taskTitle}</h3>
                ${taskDescription ? `<p style="margin: 10px 0; color: #555;">${taskDescription.substring(0, 200)}${taskDescription.length > 200 ? '...' : ''}</p>` : ''}
                <p style="margin: 10px 0;"><span class="label">Due Date:</span> ${dueDateFormatted}</p>
              </div>

              <div class="highlight">
                <strong>⚠️ Important:</strong> Mark your calendar and submit before the deadline to avoid missing points.
              </div>

              <a href="${taskUrl}" class="button">View Assignment</a>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

      await sendNotification(student.email, `📚 New Assignment: ${taskTitle}`, htmlContent);
    }
  } catch (error) {
    console.error('❌ Error in notifyStudentsOfNewTask:', error.message);
  }
};

/**
 * NOTIFICATION 4: DEADLINE REMINDER
 * Triggered by: Background job checking deadlines
 * Recipient: Students with submissions due within 24 hours
 */
const notifyStudentsOfDeadline = async (taskId, hoursUntilDeadline) => {
  try {
    console.log(`📧 [DEADLINE REMINDER] ${hoursUntilDeadline} hours until deadline`);

    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('title, due_date, class_id')
      .eq('id', taskId)
      .single();

    if (!task) {
      console.warn('⚠️  Task not found');
      return;
    }

    // Get all students in the class
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .eq('class_id', task.class_id);

    if (!enrollments || enrollments.length === 0) return;

    console.log(`   Reminding ${enrollments.length} students`);

    const dueDateFormatted = new Date(task.due_date).toLocaleString();
    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks`;

    for (const enrollment of enrollments) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) continue;

      // Check if student has already submitted
      const { data: submission } = await supabaseAdmin
        .from('task_submissions')
        .select('id')
        .eq('task_id', taskId)
        .eq('student_id', enrollment.user_id)
        .single();

      if (submission) continue; // Skip if already submitted

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">⏰ Deadline Reminder</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Submit your work before the deadline!</p>
            </div>
            <div class="content">
              <p>Hi ${student.name},</p>
              <p>This is a reminder about an upcoming deadline.</p>
              
              <div class="alert-box">
                <h3 style="margin: 0 0 10px 0; color: #d97706;">⚠️ ${task.title}</h3>
                <p style="margin: 5px 0; font-size: 16px; font-weight: 600;">Due in: ${hoursUntilDeadline} hours</p>
                <p style="margin: 5px 0;"><strong>Deadline:</strong> ${dueDateFormatted}</p>
              </div>

              <p style="color: #dc2626; font-weight: 600;">Don't miss this deadline! Submit your work now to avoid losing points.</p>
              <a href="${taskUrl}" class="button">Submit Now</a>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

      await sendNotification(student.email, `⏰ Deadline Reminder: ${task.title}`, htmlContent);
    }
  } catch (error) {
    console.error('❌ Error in notifyStudentsOfDeadline:', error.message);
  }
};

/**
 * NOTIFICATION 5: CLASS ANNOUNCEMENT
 * Triggered when: Teacher posts announcement in a class
 * Recipient: All students in that class
 */
const notifyStudentsOfAnnouncement = async (classId, announcementTitle, announcementText, teacherName) => {
  try {
    console.log(`📧 [ANNOUNCEMENT] ${announcementTitle}`);

    // Get all enrolled students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .eq('class_id', classId);

    if (!enrollments || enrollments.length === 0) return;

    console.log(`   Notifying ${enrollments.length} students`);

    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    for (const enrollment of enrollments) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) continue;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .announcement-box { background: #f0f9f7; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getEmailHeader('📢 New Announcement', `From ${teacherName}`)}
            <div class="content">
              <p>Hi ${student.name},</p>
              <p>Your instructor has posted an important announcement.</p>
              
              <div class="announcement-box">
                <h3 style="margin: 0 0 12px 0; color: ${BRAND_COLOR};">📢 ${announcementTitle}</h3>
                <p style="margin: 0;">${announcementText.substring(0, 300)}${announcementText.length > 300 ? '...' : ''}</p>
              </div>

              <p>Log in to your dashboard to read the full announcement and any additional details.</p>
              <a href="${dashboardUrl}" class="button">View Announcement</a>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

      await sendNotification(student.email, `📢 New Announcement: ${announcementTitle}`, htmlContent);
    }
  } catch (error) {
    console.error('❌ Error in notifyStudentsOfAnnouncement:', error.message);
  }
};

/**
 * NOTIFICATION 6: NEW MATERIAL POSTED
 * Triggered when: Teacher posts materials/files to a class
 * Recipient: All students enrolled in that class
 */
const notifyStudentsOfMaterialPosted = async (classId, materialTitle, materialFileName) => {
  console.log(`\n\n========================================`);
  console.log(`🚀 [NOTIFY_MATERIAL] FUNCTION CALLED`);
  console.log(`   Class ID: ${classId}`);
  console.log(`   Title: ${materialTitle}`);
  console.log(`   File: ${materialFileName}`);
  console.log(`========================================\n`);
  
  try {
    console.log(`[NOTIFY_MATERIAL] Step 1: Getting class details...`);
    console.log(`   Querying: SELECT class_name, instructor_id FROM classes WHERE id = ${classId}`);

    // Get class details
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('class_name, instructor_id')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('❌ [NOTIFY_MATERIAL] Supabase error querying class:');
      console.error('   Code:', classError.code);
      console.error('   Message:', classError.message);
      console.error('   Details:', classError.details);
      return;
    }

    if (!classData) {
      console.warn('⚠️  [NOTIFY_MATERIAL] Class not found in database');
      console.warn('   Query returned null - class may not exist or RLS policy blocked access');
      return;
    }
    console.log(`✓ [NOTIFY_MATERIAL] Class found: ${classData.class_name}`);
    
    // Get teacher info
    console.log(`[NOTIFY_MATERIAL] Step 2: Getting teacher info...`);
    const { data: teacher } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', classData.instructor_id)
      .single();

    console.log(`✓ [NOTIFY_MATERIAL] Teacher found: ${teacher?.name || 'Unknown'}`);

    // Get all enrolled students
    console.log(`[NOTIFY_MATERIAL] Step 3: Getting enrolled students...`);
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .eq('class_id', classId);

    if (!enrollments || enrollments.length === 0) {
      console.log('⚠️  [NOTIFY_MATERIAL] No students enrolled in this class');
      return;
    }

    console.log(`✓ [NOTIFY_MATERIAL] Found ${enrollments.length} students to notify`);

    const materialsUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/class/${classId}/files`;

    // Send email to each student
    console.log(`[NOTIFY_MATERIAL] Step 4: Sending emails to students...`);
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const enrollment of enrollments) {
      console.log(`   [NOTIFY_MATERIAL] Querying student ${enrollment.user_id}...`);
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', enrollment.user_id)
        .single();

      if (!student || !student.email) {
        console.warn(`   ⚠️  [NOTIFY_MATERIAL] Skipping student - no email found`);
        continue;
      }

      console.log(`   📧 [NOTIFY_MATERIAL] Preparing email for ${student.email}...`);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .material-card { background: #f9fafb; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .label { font-weight: 600; color: ${BRAND_COLOR}; }
            .button { display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .highlight { background: #fffbea; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${getEmailHeader('📚 New Material Posted', 'Study materials available')}
            <div class="content">
              <p>Hi ${student.name},</p>
              <p>New materials have been posted in <strong>${classData.class_name}</strong> by ${teacher?.name || 'your instructor'}.</p>
              
              <div class="material-card">
                <h3 style="margin: 0 0 12px 0; color: ${BRAND_COLOR};">📄 ${materialTitle}</h3>
                <p style="margin: 10px 0; color: #555;">File: ${materialFileName}</p>
                <p style="margin: 10px 0;"><span class="label">Posted:</span> ${new Date().toLocaleString()}</p>
              </div>

              <div class="highlight">
                <strong>✓ Remember:</strong> Download and review these materials to stay updated with your coursework.
              </div>

              <p>Access all class materials in the Files & Materials section of your dashboard.</p>
              <a href="${materialsUrl}" class="button">View Materials</a>
            </div>
            ${getEmailFooter()}
          </div>
        </body>
        </html>
      `;

      console.log(`   📧 Sending to: ${student.email}`);
      const result = await sendNotification(student.email, `📚 New Material: ${materialTitle}`, htmlContent);
      if (result.success) {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }
    
    console.log(`\n✅ [MATERIAL POSTED] COMPLETED`);
    console.log(`   Emails sent: ${emailsSent}`);
    console.log(`   Emails failed: ${emailsFailed}\n`);
  } catch (error) {
    console.error('❌ Error in notifyStudentsOfMaterialPosted:', error.message);
    console.error('   Full error:', error);
  }
};

// ==================== EXPORTS ====================
module.exports = {
  sendNotification,
  notifyTeacherOfSubmission,
  notifyStudentOfGrade,
  notifyStudentsOfNewTask,
  notifyStudentsOfDeadline,
  notifyStudentsOfAnnouncement,
  notifyStudentsOfMaterialPosted,
  transporter: transporter ? 'ready' : 'not-configured'
};
