import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatDateTime } from '../lib/utils';
import { branding } from '../config/branding';
import * as appointmentService from '../services/appointmentService';
import * as workerService from '../services/workerService';
import type { Appointment, Worker } from '../types';

export function CustomerAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<(Appointment & { firebaseId: string })[]>([]);
  const [workers, setWorkers] = useState<Map<string, Worker & { firebaseId: string }>>(new Map());
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const storedOwnerId = localStorage.getItem('currentShopOwnerId');

        if (!storedOwnerId) {
          showToast('Shop not configured', 'error');
          navigate('/customer/home');
          return;
        }

        if (!user) {
          return;
        }

        // Load all appointments and filter by customer
        const allAppointments = await appointmentService.getAppointments(storedOwnerId);
        const customerAppointments = allAppointments.filter((apt) => apt.customerId === user.id);
        setAppointments(customerAppointments);

        // Load workers
        const workersData = await workerService.getWorkers(storedOwnerId);
        const workersMap = new Map(workersData.map((w) => [w.firebaseId, w]));
        setWorkers(workersMap);
      } catch (error) {
        console.error('Error loading appointments:', error);
        showToast('Failed to load appointments', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate, showToast, user]);

  const now = Date.now();
  const categorizedAppointments = {
    upcoming: appointments.filter((apt) => apt.dateTime >= now && apt.status !== 'cancelled'),
    past: appointments.filter((apt) => apt.dateTime < now && apt.status !== 'cancelled'),
    cancelled: appointments.filter((apt) => apt.status === 'cancelled'),
  };

  const displayAppointments = categorizedAppointments[tab];


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const storedOwnerId = localStorage.getItem('currentShopOwnerId');
      if (!storedOwnerId) {
        showToast('Shop not configured', 'error');
        return;
      }

      await appointmentService.updateAppointmentStatus(storedOwnerId, appointmentId, 'cancelled');
      showToast('Appointment cancelled successfully', 'success');

      // Reload appointments
      const allAppointments = await appointmentService.getAppointments(storedOwnerId);
      const currentUser = localStorage.getItem('userId') || 'anonymous';
      const customerAppointments = allAppointments.filter((apt) => apt.customerId === currentUser);
      setAppointments(customerAppointments);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showToast('Failed to cancel appointment', 'error');
    }
  };

  const handleRescheduleAppointment = (appointmentId: string, workerId: string) => {
    navigate('/book', { state: { selectedWorkerId: workerId, rescheduleAppointmentId: appointmentId } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/customer/home')}>
            <span className="text-2xl">{branding.logo}</span>
            <h1 className="text-xl font-bold text-gray-900">{branding.shopName}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/home')}>
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">View and manage your bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(['upcoming', 'past', 'cancelled'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'upcoming' && 'Upcoming'}
              {t === 'past' && 'Past'}
              {t === 'cancelled' && 'Cancelled'}
              <span className="ml-2 text-sm">({categorizedAppointments[t].length})</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading appointments...</div>
        ) : displayAppointments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              {tab === 'upcoming' && 'No upcoming appointments. Ready to book?'}
              {tab === 'past' && 'No past appointments yet.'}
              {tab === 'cancelled' && 'No cancelled appointments.'}
            </p>
            {tab === 'upcoming' && (
              <Button onClick={() => navigate('/customer/home')}>Book an Appointment</Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {displayAppointments.map((apt) => (
              <Card key={apt.firebaseId} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {workers.get(apt.workerId)?.name || 'Unknown Barber'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{formatDateTime(apt.dateTime)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duration:</span> {apt.totalDuration} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Price:</span>{' '}
                    <span className="font-semibold text-blue-600">{apt.totalPrice.toFixed(2)} LE</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  {tab === 'upcoming' && apt.status === 'pending' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleCancelAppointment(apt.firebaseId)}
                    >
                      Cancel
                    </Button>
                  )}
                  {tab === 'upcoming' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRescheduleAppointment(apt.firebaseId, apt.workerId)}
                    >
                      Reschedule
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
