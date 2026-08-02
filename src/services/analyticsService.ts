import type { Appointment, Service } from '../types';
import { getWorkers } from './workerService';
import { getAllWorkerServices } from './serviceService';

export interface DashboardStats {
  totalWorkers: number;
  totalCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingAppointments: number;
  approvedAppointments: number;
  completedAppointments: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  appointmentCount: number;
}

export interface ServicePopularity {
  serviceName: string;
  count: number;
  revenue: number;
}

export async function getDashboardStats(
  ownerId: string,
  appointments: (Appointment & { firebaseId: string })[]
): Promise<DashboardStats> {
  const workers = await getWorkers(ownerId);
  const uniqueCustomers = new Set(appointments.map((apt) => apt.customerId));

  const pendingAppointments = appointments.filter((apt) => apt.status === 'pending').length;
  const approvedAppointments = appointments.filter((apt) => apt.status === 'approved').length;
  const cancelledAppointments = appointments.filter((apt) => apt.status === 'cancelled').length;

  const totalRevenue = appointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalPrice, 0);

  return {
    totalWorkers: workers.length,
    totalCustomers: uniqueCustomers.size,
    totalAppointments: appointments.length,
    totalRevenue,
    pendingAppointments,
    approvedAppointments,
    completedAppointments: cancelledAppointments,
  };
}

export function getMonthlyRevenue(
  appointments: (Appointment & { firebaseId: string })[]
): MonthlyRevenue[] {
  const monthlyData = new Map<string, { revenue: number; count: number }>();

  appointments.forEach((apt) => {
    if (apt.status === 'completed') {
      const date = new Date(apt.dateTime);
      const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      const existing = monthlyData.get(month) || { revenue: 0, count: 0 };
      existing.revenue += apt.totalPrice;
      existing.count += 1;
      monthlyData.set(month, existing);
    }
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      appointmentCount: data.count,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-12);
}

export async function getServicePopularity(
  ownerId: string,
  appointments: (Appointment & { firebaseId: string })[]
): Promise<ServicePopularity[]> {
  const allServices = await getAllWorkerServices(ownerId);
  const serviceMap = new Map<string, Service & { firebaseId: string }>();

  allServices.forEach((services) => {
    services.forEach((service) => {
      serviceMap.set(service.firebaseId, service);
    });
  });

  const serviceStats = new Map<string, { count: number; revenue: number }>();

  appointments.forEach((apt) => {
    if (apt.status === 'completed') {
      apt.selectedServices.forEach((serviceId) => {
        const service = serviceMap.get(serviceId);
        if (service) {
          const existing = serviceStats.get(serviceId) || { count: 0, revenue: 0 };
          existing.count += 1;
          existing.revenue += service.price;
          serviceStats.set(serviceId, existing);
        }
      });
    }
  });

  return Array.from(serviceStats.entries())
    .map(([serviceId, stats]) => {
      const service = serviceMap.get(serviceId);
      return {
        serviceName: service?.name || 'Unknown',
        count: stats.count,
        revenue: stats.revenue,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getRecentAppointments(
  appointments: (Appointment & { firebaseId: string })[],
  limit = 5
): (Appointment & { firebaseId: string })[] {
  return appointments.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
