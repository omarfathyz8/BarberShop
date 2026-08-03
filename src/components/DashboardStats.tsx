import { Card } from './ui/Card';
import type { DashboardStats as DashboardStatsType } from '../services/analyticsService';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      label: 'Total Workers',
      value: stats.totalWorkers,
      icon: '✂️',
      color: 'text-blue-500',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: '👦🏻',
      color: 'text-orange-500',
    },
    {
      label: 'Total Appointments',
      value: stats.totalAppointments,
      icon: '📅',
      color: 'text-purple-500',
    },
    {
      label: 'Total Revenue',
      value: `${stats.totalRevenue.toFixed(2)} LE`,
      icon: '💰',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Completed Appointments',
      value: stats.completedAppointments,
      icon: '🏆',
      color: 'text-green-500',
    },
    {
      label: 'Cancelled Appointments',
      value: stats.cancelledAppointments,
      icon: '❌',
      color: 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.color} p-6 border-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value ?? 0}</p>
            </div>
            <div className="text-4xl">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
