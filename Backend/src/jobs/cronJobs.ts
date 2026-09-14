import Queue from 'bull';
import { config } from '../config';
import { AttendanceService } from '../services/attendanceService';
import { TitheService } from '../services/titheService';
import { BirthdayService } from '../services/birthdayService';

// Create job queues
export const birthdayQueue = new Queue('birthday-notifications', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

export const absenceQueue = new Queue('absence-notifications', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

export const titheReminderQueue = new Queue('tithe-reminders', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

// Birthday greeting processor
birthdayQueue.process(async (_job) => {
  console.log('Processing birthday greetings...');
  const result = await BirthdayService.sendTodaysGreetings();
  console.log(
    `Birthdays for ${result.localDate}: ${result.candidates} today, ` +
      `${result.claimed} to greet, ${result.sent} sent, ${result.failed} failed`
  );
});

// Absence notification processor
absenceQueue.process(async (_job) => {
  console.log('Processing absence notifications...');
  await AttendanceService.checkAndNotifyAbsences();
  console.log('Absence notifications processed');
});

// Tithe reminder processor
titheReminderQueue.process(async (_job) => {
  console.log('Processing tithe reminders...');
  await TitheService.checkAndNotifyMissedTithes();
  console.log('Tithe reminders processed');
});

// Schedule jobs
export async function setupCronJobs() {
  // Daily just after midnight. The server runs UTC and the church is an hour
  // ahead, so this fires early on the correct local day; the service derives
  // "today" in the church's timezone regardless.
  await birthdayQueue.add(
    {},
    {
      repeat: {
        cron: '0 0 * * *', // Daily at midnight
      },
    }
  );

  // Check for absences every Monday at 10 AM
  await absenceQueue.add(
    {},
    {
      repeat: {
        cron: '0 10 * * 1', // Every Monday at 10:00 AM
      },
    }
  );

  // Check for missed tithes every Friday at 5 PM
  await titheReminderQueue.add(
    {},
    {
      repeat: {
        cron: '0 17 * * 5', // Every Friday at 5:00 PM
      },
    }
  );

  console.log('Cron jobs scheduled successfully');
}

// Graceful shutdown
export async function shutdownJobs() {
  await birthdayQueue.close();
  await absenceQueue.close();
  await titheReminderQueue.close();
  console.log('All job queues closed');
}
