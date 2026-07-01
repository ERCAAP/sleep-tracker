import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  bedtimeReminder: boolean;
  bedtimeReminderTime: string; // HH:MM format
  smartAlarm: boolean;
  smartAlarmTime: string; // HH:MM format
  smartAlarmWindow: number; // minutes before alarm time
  sleepGoalReminder: boolean;
  weeklyReport: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: 'bedtime' | 'alarm' | 'goal' | 'weekly';
  title: string;
  body: string;
  scheduledFor: Date;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationToken: string | null = null;
  private settings: NotificationSettings = {
    bedtimeReminder: true,
    bedtimeReminderTime: '22:00',
    smartAlarm: true,
    smartAlarmTime: '07:00',
    smartAlarmWindow: 30,
    sleepGoalReminder: true,
    weeklyReport: true,
  };

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Load settings from storage
      await this.loadSettings();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get notification token
      this.notificationToken = await this.registerForPushNotifications();
      
      // Schedule initial notifications
      await this.scheduleDefaultNotifications();

      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return false;
    }

    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('sleep-tracker', {
          name: 'Sleep Tracker',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push notification token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    
    // Reschedule notifications with new settings
    await this.cancelAllNotifications();
    await this.scheduleDefaultNotifications();
  }

  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async scheduleDefaultNotifications(): Promise<void> {
    const notifications: ScheduledNotification[] = [];

    // Bedtime reminder
    if (this.settings.bedtimeReminder) {
      notifications.push({
        id: 'bedtime-reminder',
        type: 'bedtime',
        title: '🌙 Yatma Zamanı',
        body: 'İyi bir uyku için yatma vaktiniz geldi. Cihazlarınızı kapatın ve gevşemeye odaklanın.',
        scheduledFor: this.getNextScheduleTime(this.settings.bedtimeReminderTime),
        data: { type: 'bedtime' }
      });
    }

    // Smart alarm
    if (this.settings.smartAlarm) {
      notifications.push({
        id: 'smart-alarm',
        type: 'alarm',
        title: '☀️ Günaydın!',
        body: 'Uyanma zamanınız geldi. Yeni bir güne başlamak için hazır mısınız?',
        scheduledFor: this.getNextScheduleTime(this.settings.smartAlarmTime),
        data: { type: 'alarm' }
      });
    }

    // Sleep goal reminder (every 3 days)
    if (this.settings.sleepGoalReminder) {
      const goalReminderTime = new Date();
      goalReminderTime.setDate(goalReminderTime.getDate() + 3);
      goalReminderTime.setHours(20, 0, 0, 0);

      notifications.push({
        id: 'goal-reminder',
        type: 'goal',
        title: '🎯 Uyku Hedefleriniz',
        body: 'Bu hafta uyku hedeflerinize ne kadar yaklaştınız? Kontrol edin!',
        scheduledFor: goalReminderTime,
        data: { type: 'goal' }
      });
    }

    // Weekly report (every Sunday at 19:00)
    if (this.settings.weeklyReport) {
      const weeklyReportTime = new Date();
      const daysUntilSunday = (7 - weeklyReportTime.getDay()) % 7;
      weeklyReportTime.setDate(weeklyReportTime.getDate() + daysUntilSunday);
      weeklyReportTime.setHours(19, 0, 0, 0);

      notifications.push({
        id: 'weekly-report',
        type: 'weekly',
        title: '📊 Haftalık Uyku Raporu',
        body: 'Bu haftaki uyku verileriniz hazır! Analizinizi görüntüleyin.',
        scheduledFor: weeklyReportTime,
        data: { type: 'weekly' }
      });
    }

    // Schedule all notifications
    for (const notification of notifications) {
      await this.scheduleNotification(notification);
    }
  }

  private getNextScheduleTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date();
    
    scheduled.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled;
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: {
          type: 'date',
          date: notification.scheduledFor,
          repeats: true,
        } as any,
      });

      console.log(`Scheduled notification ${notification.type} for ${notification.scheduledFor}`);
      return notificationId;
    } catch (error) {
      console.error(`Failed to schedule notification ${notification.type}:`, error);
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`Cancelled notification: ${identifier}`);
    } catch (error) {
      console.error(`Failed to cancel notification ${identifier}:`, error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.presentNotificationAsync({
        title,
        body,
        data,
      });
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  // Sleep tracking specific notifications
  async notifySleepSessionStarted(): Promise<void> {
    await this.sendImmediateNotification(
      '🌙 Uyku Takibi Başladı',
      'Uyku seansınız başarıyla başlatıldı. İyi uykular!',
      { type: 'sleep_started' }
    );
  }

  async notifySleepSessionEnded(duration: number): Promise<void> {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    await this.sendImmediateNotification(
      '☀️ Uyku Takibi Tamamlandı',
      `Uyku süreniz: ${hours}sa ${minutes}dk. Günaydın!`,
      { type: 'sleep_ended', duration }
    );
  }

  async notifyGoalAchieved(goalType: string): Promise<void> {
    await this.sendImmediateNotification(
      '🎉 Hedef Başarıldı!',
      `${goalType} hedefinizi başardınız. Tebrikler!`,
      { type: 'goal_achieved', goalType }
    );
  }

  getNotificationToken(): string | null {
    return this.notificationToken;
  }
}

export default NotificationService; 