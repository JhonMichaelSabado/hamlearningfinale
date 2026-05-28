const supabase = require('../config/supabase');
const { notifyDeadlineReminder } = require('./emailService');

/**
 * Check for upcoming deadlines and send reminders
 * This should run periodically (e.g., every hour via a cron job)
 */
const checkAndNotifyDeadlines = async () => {
  try {
    console.log('Checking for upcoming deadlines...');

    // Get current time and time 24 hours from now
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get tasks with deadlines in the next 24 hours that haven't been notified yet
    const { data: tasksNearDeadline, error } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('type', 'teacher')
      .gte('due_date', now.toISOString())
      .lte('due_date', in24Hours.toISOString());

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    if (!tasksNearDeadline || tasksNearDeadline.length === 0) {
      console.log('No tasks with upcoming deadlines');
      return;
    }

    console.log(`Found ${tasksNearDeadline.length} tasks with upcoming deadlines`);

    // Send reminder for each task
    for (const task of tasksNearDeadline) {
      const hoursUntilDeadline = Math.ceil(
        (new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      console.log(`Sending deadline reminder for task: ${task.title} (${hoursUntilDeadline} hours remaining)`);
      
      await notifyDeadlineReminder(task.id, hoursUntilDeadline);
    }
  } catch (error) {
    console.error('Error in deadline reminder job:', error);
  }
};

/**
 * Setup cron-like scheduling using Node.js intervals
 * Call this once when the server starts
 * 
 * Alternative: Use 'node-cron' package for more sophisticated scheduling
 * npm install node-cron
 */
const initializeDeadlineReminders = () => {
  // Check every hour (3600000 ms)
  const interval = process.env.DEADLINE_CHECK_INTERVAL || 3600000;
  
  console.log(`Deadline reminder job initialized. Checking every ${interval / 1000 / 60} minutes`);
  
  setInterval(checkAndNotifyDeadlines, interval);

  // Also run once on startup
  checkAndNotifyDeadlines();
};

module.exports = {
  checkAndNotifyDeadlines,
  initializeDeadlineReminders
};
