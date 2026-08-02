import { format } from 'date-fns';
import { branding } from '../config/branding';

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), branding.dateFormat);
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function getTimeSlots(
  start: string,
  end: string,
  duration: number,
  bookedSlots: number[] = []
): { time: string; timestamp: number }[] {
  const slots = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  let currentTime = new Date();
  currentTime.setHours(startHour, startMin, 0, 0);
  const endTime = new Date();
  endTime.setHours(endHour, endMin, 0, 0);

  while (currentTime < endTime) {
    const timestamp = currentTime.getTime();
    const isBooked = bookedSlots.some(
      (bookedTime) =>
        bookedTime <= timestamp &&
        timestamp < bookedTime + duration * 60 * 1000
    );

    if (!isBooked) {
      slots.push({
        time: formatTime(currentTime),
        timestamp,
      });
    }

    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  return slots;
}

export function getDayName(date: Date): string {
  return format(date, 'EEEE').toLowerCase() as any;
}
