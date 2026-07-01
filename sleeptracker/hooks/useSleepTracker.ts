import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addSleepSession } from '../database/models';

export function useSleepTracker() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('00:00:00');
  const timerRef = useRef<any>(null); // Use any to avoid type conflicts

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    timerRef.current = setInterval(() => {
      setDuration(formatDuration(new Date().getTime() - now.getTime()));
    }, 1000);
  };

  const stopTracking = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsTracking(false);
    setDuration('00:00:00');

    if (startTime && user?.uid) {
      const endTime = new Date();
      const totalSleepTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const idealSleep = 8 * 60 * 60;
      const sleepScore = Math.min(100, Math.floor((totalSleepTime / idealSleep) * 100));
      
      const session = {
        userId: user.uid,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalSleepTime,
        sleepScore,
        quality: sleepScore > 85 ? 'Excellent' : sleepScore > 70 ? 'Good' : sleepScore > 50 ? 'Fair' : 'Poor',
        notes: '',
      };

      try {
        await addSleepSession(session);
        console.log('Sleep session saved successfully!');
      } catch (error) {
        console.error('Failed to save sleep session:', error);
      }
    }
    setStartTime(null);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return { isTracking, duration, startTracking, stopTracking };
} 