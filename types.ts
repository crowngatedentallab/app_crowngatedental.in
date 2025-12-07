
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  TECHNICIAN = 'TECHNICIAN'
}

export enum OrderStatus {
  SUBMITTED = 'Submitted',
  DESIGNING = 'Designing',
  METAL_COPING = 'Metal Coping',
  BISQUE_TRIAL = 'Bisque Trial',
  METAL_TRIAL = 'Metal Trial',
  PROCESSING = 'Processing',
  TEETH_ARRANGEMENT = 'Teeth Arrangement',
  TRIAL_WORK = 'Trial Work',
  MILLING = 'Milling',
  GLAZING = 'Glazing',
  DISPATCHED = 'Dispatched',
  DELIVERED = 'Delivered'
}



export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed!
  fullName: string;
  role: UserRole;
  relatedEntity?: string; // e.g., Clinic Name for Doctors
}

export interface Product {
  id: string;
  name: string;
  code: string;       // e.g., "ZC", "EMV"
  isActive: boolean;  // For soft deletion/hiding
  category?: string;
}

export interface Order {
  id: string;
  patientName: string;
  doctorName: string; // Links to User.fullName or User.id
  clinicName?: string;
  toothNumber: string;
  shade: string;
  productType: string; // e.g., Zirconia, E-Max
  status: OrderStatus;
  submissionDate: string;
  dueDate: string;
  notes?: string;
  assignedTech?: string; // Links to User.fullName
  technicianHistory?: string[]; // List of all technicians who worked on this
  priority: 'Normal' | 'Urgent';
  attachments?: string[]; // URLs of uploaded files
  completedDate?: string; // ISO string when status becomes Dispatched/Delivered
}

export interface DashboardStats {
  totalActive: number;
  urgent: number;
  revenue: number;
  completionRate: number;
}

export interface Notification {
  id: string;
  userId: string; // Or UserRole for broader alerts, but individual is safer pattern
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string; // ISO String
  link?: string; // e.g. /orders/123
}
