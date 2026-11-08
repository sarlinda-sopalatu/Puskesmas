export const STAFF_ROLES = [
  'administrator',
  'registration',
  'doctor',
  'nurse',
  'pharmacy',
  'cashier',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type ClinicCode = 'UM' | 'GG' | 'AN' | 'KI' | 'TB';

export type Sex = 'L' | 'P';

export type Coverage = 'BPJS' | 'Umum';

export interface Staff {
  id: string;
  username: string;
  password: string;
  name: string;
  role: StaffRole;
  clinic?: ClinicCode;
  active: boolean;
}

export interface Patient {
  id: string;
  rm: string;
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  sex: Sex;
  address: string;
  phone: string;
  coverage: Coverage;
  emergencyContact: string;
  createdAt: string;
}

export type TicketStatus = 'waiting' | 'called' | 'done' | 'cancelled';

export interface Ticket {
  id: string;
  code: string;
  number: number;
  patientId: string;
  clinic: ClinicCode;
  priority: boolean;
  priorityNote?: string;
  status: TicketStatus;
  createdAt: string;
  calledAt?: string;
  closedAt?: string;
  estimateMinutes: number;
}

export type StockGroup =
  | 'Analgesik'
  | 'Antibiotik'
  | 'Antihistamin'
  | 'Vitamin'
  | 'Cairan'
  | 'Antiseptik'
  | 'Metabolik'
  | 'Kortikosteroid';

export interface StockItem {
  id: string;
  name: string;
  group: StockGroup;
  unit: string;
  stock: number;
  minStock: number;
  price: number;
  expiry: string;
}

export interface PrescriptionLine {
  itemId: string;
  quantity: number;
  instruction: string;
}

export interface Vitals {
  bloodPressure: string;
  pulse: string;
  temperature: string;
  respiration: string;
  weight: string;
  height: string;
  oxygen: string;
}

export interface MedicalRecord {
  id: string;
  ticketId: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  complaint: string;
  history: string;
  vitals: Vitals;
  diagnosis: string;
  treatment: string;
  notes: string;
  referral: string;
  followUpDate: string;
  prescription: PrescriptionLine[];
  handedOver: boolean;
}

export type PaymentMethod = 'Tunai' | 'BPJS' | 'Transfer';

export type InvoiceStatus = 'open' | 'paid';

export interface InvoiceLine {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  recordId?: string;
  createdAt: string;
  lines: InvoiceLine[];
  status: InvoiceStatus;
  method?: PaymentMethod;
  paidAt?: string;
}

export interface ClinicData {
  staff: Staff[];
  patients: Patient[];
  tickets: Ticket[];
  stockItems: StockItem[];
  records: MedicalRecord[];
  invoices: Invoice[];
}

export type PatientInput = Omit<Patient, 'id' | 'rm' | 'createdAt'>;

export type StaffInput = {
  name: string;
  username: string;
  password: string;
  role: StaffRole;
  clinic?: ClinicCode;
};

export type MedicalRecordInput = {
  ticketId: string;
  patientId: string;
  doctorId: string;
  complaint: string;
  history: string;
  vitals: Vitals;
  diagnosis: string;
  treatment: string;
  notes: string;
  referral: string;
  followUpDate: string;
  prescription: PrescriptionLine[];
};

export type ActionResult = {
  ok: boolean;
  message?: string;
};

export interface CreateTicketInput {
  patientId: string;
  clinic: ClinicCode;
  priority: boolean;
  priorityNote?: string;
}
