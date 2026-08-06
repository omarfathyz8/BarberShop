import { Card } from './ui/Card';
import type { Appointment } from '../types';

interface WorkerStatsProps {
  appointments: (Appointment & { firebaseId: string })[];
}

export function WorkerStats({ appointments }: WorkerStatsProps) {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = today.getTime() + 24 * 60 * 60 * 1000;

  const todayAppointments = appointments.filter(
    (apt) => apt.dateTime >= today.getTime() && apt.dateTime < todayEnd
  );

  const upcomingAppointments = appointments.filter((apt) => apt.dateTime >= now);

  const pendingAppointments = appointments.filter((apt) => apt.status === 'pending');

  const approvedAppointments = appointments.filter((apt) => apt.status === 'approved');

  const dailyEarnings = todayAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalPrice, 0);

  const statCards = [
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      icon: '📅',
      color: 'text-blue-500',
    },
    {
      label: 'Upcoming (7 days)',
      value: upcomingAppointments.filter(
        (apt) => apt.dateTime < now + 7 * 24 * 60 * 60 * 1000
      ).length,
      icon: '📆',
      color: 'text-purple-500',
    },
    {
      label: 'Pending Approval',
      value: pendingAppointments.length,
      icon: '⏳',
      color: 'text-yellow-500',
    },
    {
      label: 'Approved',
      value: approvedAppointments.length,
      icon: '✅',
      color: 'text-green-500',
    },
    {
      label: "Today's Earnings",
      value: `${dailyEarnings.toFixed(2)} LE`,
      icon: '💰',
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.color} p-4 border-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-75">{stat.label}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
