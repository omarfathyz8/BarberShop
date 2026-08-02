import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { DashboardStats } from '../components/DashboardStats';
import { WorkerManagement } from '../components/WorkerManagement';
import { ServiceManagement } from '../components/ServiceManagement';
import { AppointmentManagement } from '../components/AppointmentManagement';
import { CustomerList } from '../components/CustomerList';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { Card } from '../components/ui/Card';
import { formatDateTime } from '../lib/utils';
import {
  createWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
} from '../services/workerService';
import {
  createService,
  getAllWorkerServices,
  updateService,
  deleteService,
} from '../services/serviceService';
import {
  getAppointments,
  updateAppointmentStatus,
} from '../services/appointmentService';
import {
  getDashboardStats,
} from '../services/analyticsService';
import { getCustomers } from '../services/customerService';
import type { Appointment, Service, Worker, AppointmentStatus } from '../types';

export function OwnerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState('overview');
  const [workers, setWorkers] = useState<(Worker & { firebaseId: string })[]>([]);
  const [appointments, setAppointments] = useState<(Appointment & { firebaseId: string })[]>([]);
  const [services, setServices] = useState<Map<string, (Service & { firebaseId: string })[]>>(
    new Map()
  );
  const [customers, setCustomers] = useState<Map<string, any>>(new Map());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ownerId = user?.id || '';

  useEffect(() => {
    if (!ownerId) return;
    loadData();
  }, [ownerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersData, appointmentsData, servicesData, customersData] = await Promise.all([
        getWorkers(ownerId),
        getAppointments(ownerId),
        getAllWorkerServices(ownerId),
        getCustomers(ownerId),
      ]);

      setWorkers(workersData);
      setAppointments(appointmentsData);
      setServices(servicesData);

      // Create a map of customers by ID for easy lookup
      const customersMap = new Map(customersData.map((c) => [c.id, c]));
      setCustomers(customersMap);

      const dashboardStats = await getDashboardStats(ownerId, appointmentsData);
      // Update stats with actual customer count
      setStats({
        ...dashboardStats,
        totalCustomers: customersData.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (workerData: Omit<Worker, 'id'>, tempPassword: string) => {
    try {
      // Save worker to database FIRST (while still authenticated as owner)
      console.log('Creating worker in database:', workerData.email);
      await createWorker(ownerId, workerData, tempPassword);
      console.log('Worker created in database with temp password');

      // Show success message
      showToast('Worker added successfully!', 'success');

      // Reload data after a longer delay to allow credentials dialog to be seen
      setTimeout(() => loadData(), 3000);
    } catch (error) {
      console.error('Error adding worker:', error);
      showToast(error instanceof Error ? error.message : 'Error adding worker', 'error');
    }
  };

  const handleUpdateWorker = async (
    workerId: string,
    workerData: Partial<Worker>
  ) => {
    try {
      await updateWorker(ownerId, workerId, workerData);
      showToast('Worker updated successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error updating worker:', error);
      showToast('Error updating worker', 'error');
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!window.confirm('Are you sure you want to delete this worker?')) return;

    try {
      await deleteWorker(ownerId, workerId);
      showToast('Worker deleted successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error deleting worker:', error);
      showToast('Error deleting worker', 'error');
    }
  };

  const handleAddService = async (
    workerId: string,
    serviceData: Omit<Service, 'id'>
  ) => {
    try {
      await createService(ownerId, workerId, serviceData);
      showToast('Service added successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error adding service:', error);
      showToast('Error adding service', 'error');
    }
  };

  const handleUpdateService = async (
    workerId: string,
    serviceId: string,
    serviceData: Partial<Service>
  ) => {
    try {
      await updateService(ownerId, workerId, serviceId, serviceData);
      showToast('Service updated successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error updating service:', error);
      showToast('Error updating service', 'error');
    }
  };

  const handleDeleteService = async (workerId: string, serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteService(ownerId, workerId, serviceId);
      showToast('Service deleted successfully', 'success');
      await loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Error deleting service', 'error');
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    try {
      await updateAppointmentStatus(ownerId, appointmentId, status);
      showToast(`Appointment ${status}`, 'success');
      await loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('Error updating appointment', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const workersMap = new Map(workers.map((w) => [w.firebaseId, w]));

  return (
    <DashboardLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'overview' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-2">Welcome back to your barbershop</p>
          </div>

          {stats && <DashboardStats stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Upcoming Appointments
              </h3>
              <div className="space-y-3">
                {appointments
                  .filter((apt) => apt.dateTime >= Date.now() && apt.status !== 'cancelled')
                  .sort((a, b) => a.dateTime - b.dateTime)
                  .slice(0, 5)
                  .map((apt) => {
                    return (
                      <div
                        key={apt.firebaseId}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDateTime(apt.dateTime)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {apt.totalPrice.toFixed(2)} LE
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            apt.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : apt.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Popular Services
              </h3>
              <div className="space-y-3">
                {/* Services will be shown when data is loaded */}
                <p className="text-sm text-gray-600">
                  Monitor your most popular services
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {currentTab === 'workers' && (
        <WorkerManagement
          workers={workers}
          services={services}
          appointments={appointments}
          onAddWorker={handleAddWorker}
          onUpdateWorker={handleUpdateWorker}
          onDeleteWorker={handleDeleteWorker}
        />
      )}

      {currentTab === 'services' && (
        <ServiceManagement
          ownerId={ownerId}
          workers={workers}
          services={services}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
        />
      )}

      {currentTab === 'appointments' && (
        <AppointmentManagement
          appointments={appointments}
          workers={workersMap}
          customers={customers}
          onUpdateStatus={handleUpdateAppointmentStatus}
        />
      )}

      {currentTab === 'customers' && (
        <CustomerList ownerId={ownerId} />
      )}

      {currentTab === 'analytics' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Monitor your business performance with detailed analytics</p>
          </div>
          <AnalyticsCharts appointments={appointments} ownerId={ownerId} />
        </div>
      )}
    </DashboardLayout>
  );
}
