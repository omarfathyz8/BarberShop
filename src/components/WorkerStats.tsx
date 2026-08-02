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

  const totalEarnings = appointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalPrice, 0);

  const statCards = [
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      icon: '📅',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Upcoming (7 days)',
      value: upcomingAppointments.filter(
        (apt) => apt.dateTime < now + 7 * 24 * 60 * 60 * 1000
      ).length,
      icon: '📆',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Pending Approval',
      value: pendingAppointments.length,
      icon: '⏳',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Approved',
      value: approvedAppointments.length,
      icon: '✅',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Earnings',
      value: `${totalEarnings.toFixed(2)} LE`,
      icon: '💰',
      color: 'bg-green-50 text-green-600',
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
