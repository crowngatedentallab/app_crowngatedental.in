
import { Order, OrderStatus, User, UserRole, Product } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'password123',
    fullName: 'Admin User',
    role: UserRole.ADMIN
  },
  {
    id: 'USR-002',
    username: 'drsmith',
    password: 'password123',
    fullName: 'Dr. Smith',
    role: UserRole.DOCTOR,
    relatedEntity: 'Smile Care Clinic'
  },
  {
    id: 'USR-003',
    username: 'drpatel',
    password: 'password123',
    fullName: 'Dr. Patel',
    role: UserRole.DOCTOR,
    relatedEntity: 'Dental Arts'
  },
  {
    id: 'USR-004',
    username: 'techmike',
    password: 'password123',
    fullName: 'Tech Mike',
    role: UserRole.TECHNICIAN
  },
  {
    id: 'USR-005',
    username: 'techsarah',
    password: 'password123',
    fullName: 'Tech Sarah',
    role: UserRole.TECHNICIAN
  }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'PROD-1', name: 'Zirconia Crown' },
  { id: 'PROD-2', name: 'E-Max Veneer' },
  { id: 'PROD-3', name: 'PFM (Porcelain Fused to Metal)' },
  { id: 'PROD-4', name: 'Implant Abutment' },
  { id: 'PROD-5', name: 'Full Arch Hybrid' },
  { id: 'PROD-6', name: 'Nightguard / Splint' },
  { id: 'PROD-7', name: 'Temporary Crown' }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    clinicName: 'Smile Care',
    toothNumber: '14, 15',
    shade: 'A2',
    typeOfWork: 'Zirconia Crown',
    status: OrderStatus.DESIGNING,
    submissionDate: '2023-10-25',
    dueDate: '2023-11-01',
    assignedTech: 'Tech Mike',
    priority: 'Normal',
    notes: 'Please check margins carefully.'
  },
  {
    id: 'ORD-002',
    patientName: 'Sarah Connor',
    doctorName: 'Dr. Patel',
    clinicName: 'Dental Arts',
    toothNumber: '21',
    shade: 'B1',
    typeOfWork: 'E-Max Veneer',
    status: OrderStatus.SUBMITTED,
    submissionDate: '2023-10-26',
    dueDate: '2023-11-02',
    priority: 'Urgent',
    assignedTech: 'Tech Sarah',
    notes: 'Patient travelling next week.'
  },
  {
    id: 'ORD-003',
    patientName: 'Michael Ross',
    doctorName: 'Dr. Smith',
    clinicName: 'Smile Care',
    toothNumber: '46',
    shade: 'A3',
    typeOfWork: 'PFM',
    status: OrderStatus.GLAZING,
    submissionDate: '2023-10-20',
    dueDate: '2023-10-28',
    assignedTech: 'Tech Sarah',
    priority: 'Normal'
  },
  {
    id: 'ORD-004',
    patientName: 'Emily Blunt',
    doctorName: 'Dr. Lee',
    clinicName: 'City Dental',
    toothNumber: '11',
    shade: 'A1',
    typeOfWork: 'Zirconia Layered',
    status: OrderStatus.DISPATCHED,
    submissionDate: '2023-10-15',
    dueDate: '2023-10-22',
    assignedTech: 'Tech Mike',
    priority: 'Normal'
  },
  {
    id: 'ORD-005',
    patientName: 'Bruce Wayne',
    doctorName: 'Dr. Smith',
    clinicName: 'Smile Care',
    toothNumber: '36',
    shade: 'A3.5',
    typeOfWork: 'Implant Abutment',
    status: OrderStatus.RECEIVED,
    submissionDate: '2023-10-27',
    dueDate: '2023-11-05',
    assignedTech: 'Tech Mike', 
    priority: 'Urgent'
  }
];
