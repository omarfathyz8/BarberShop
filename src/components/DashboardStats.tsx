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
      icon: '👥',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: '👨',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Appointments',
      value: stats.totalAppointments,
      icon: '📅',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Total Revenue',
      value: `${stats.totalRevenue.toFixed(2)} LE`,
      icon: '💰',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Pending Appointments',
      value: stats.pendingAppointments,
      icon: '⏳',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Approved Appointments',
      value: stats.approvedAppointments,
      icon: '✅',
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.color} p-6 border-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className="text-4xl">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
