export type UserRole = 'owner' | 'worker' | 'customer';

export type AppointmentStatus = 'pending' | 'approved' | 'cancelled' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface WorkerUser extends User {
  workerId: string;
  ownerId: string;
}

export interface Worker extends User {
  bio: string;
  workingHours: WorkingHours;
}

export interface WorkingHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface TimeSlot {
  start: string;
  end: string;
  isOpen: boolean;
}

export interface Service {
  id: string;
  workerId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface Customer extends User {
  appointmentsCount: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  workerId: string;
  selectedServices: string[];
  dateTime: number;
  totalPrice: number;
  totalDuration: number;
  status: AppointmentStatus;
  notes: string;
  createdAt: number;
}

export interface AvailableSlot {
  time: string;
  timestamp: number;
}
