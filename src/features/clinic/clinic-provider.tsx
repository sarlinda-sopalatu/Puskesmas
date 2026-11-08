import { createContext, useContext, useState, type ReactNode } from 'react';

import { expiryStatus } from '@/core/format';
import { createSeedData } from './seed';
import { clinicInfo } from './selectors';
import type {
  ActionResult,
  ClinicData,
  CreateTicketInput,
  Invoice,
  MedicalRecord,
  MedicalRecordInput,
  Patient,
  PatientInput,
  PaymentMethod,
  Staff,
  StaffInput,
  StaffRole,
  Ticket,
  TicketStatus,
} from './types';

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function nextInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const highest = invoices.reduce((max, invoice) => {
    if (!invoice.number.startsWith(prefix)) return max;
    const sequence = Number(invoice.number.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

function nextRmNumber(patients: Patient[]): string {
  const year = new Date().getFullYear();
  const prefix = `RM-${year}-`;
  const highest = patients.reduce((max, patient) => {
    if (!patient.rm.startsWith(prefix)) return max;
    const sequence = Number(patient.rm.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

export interface ClinicActions {
  registerPatient: (input: PatientInput) => Patient;
  updatePatient: (id: string, input: PatientInput) => Patient | undefined;
  createTicket: (input: CreateTicketInput) => Ticket;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  callNext: (clinic?: CreateTicketInput['clinic']) => Ticket | undefined;
  saveMedicalRecord: (input: MedicalRecordInput) => MedicalRecord;
  handOverPrescription: (recordId: string) => ActionResult;
  adjustStock: (itemId: string, delta: number) => ActionResult;
  payInvoice: (invoiceId: string, method: PaymentMethod) => ActionResult;
  addStaff: (input: StaffInput) => ActionResult & { staff?: Staff };
  setStaffActive: (id: string, active: boolean) => void;
  resetStaffPassword: (id: string) => string | undefined;
  isUsernameTaken: (username: string, exceptId?: string) => boolean;
}

type ClinicContextValue = ClinicData & {
  actions: ClinicActions;
};

const ClinicContext = createContext<ClinicContextValue | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClinicData>(createSeedData);

  const isUsernameTaken = (username: string, exceptId?: string) =>
    data.staff.some(
      (member) =>
        member.id !== exceptId &&
        member.username.toLowerCase() === username.trim().toLowerCase(),
    );

  const registerPatient = (input: PatientInput): Patient => {
    const patient: Patient = {
      ...input,
      id: uid('pat'),
      rm: nextRmNumber(data.patients),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, patients: [patient, ...prev.patients] }));
    return patient;
  };

  const updatePatient = (id: string, input: PatientInput): Patient | undefined => {
    const existing = data.patients.find((patient) => patient.id === id);
    if (!existing) return undefined;
    const updated: Patient = { ...existing, ...input };
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((patient) => (patient.id === id ? updated : patient)),
    }));
    return updated;
  };

  const createTicket = (input: CreateTicketInput): Ticket => {
    const clinicTickets = data.tickets.filter((ticket) => ticket.clinic === input.clinic);
    const highestNumber = clinicTickets.reduce(
      (max, ticket) => Math.max(max, ticket.number),
      0,
    );
    const waitingCount = clinicTickets.filter((ticket) => ticket.status === 'waiting').length;
    const number = highestNumber + 1;
    const ticket: Ticket = {
      id: uid('tkt'),
      code: `${input.clinic}-${String(number).padStart(3, '0')}`,
      number,
      patientId: input.patientId,
      clinic: input.clinic,
      priority: input.priority,
      priorityNote: input.priorityNote,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      estimateMinutes: input.priority ? 5 : 10 + waitingCount * 5,
    };
    setData((prev) => ({ ...prev, tickets: [...prev.tickets, ticket] }));
    return ticket;
  };

  const setTicketStatus = (id: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => {
        if (ticket.id !== id) return ticket;
        return {
          ...ticket,
          status,
          calledAt:
            status === 'called' ? ticket.calledAt ?? now : ticket.calledAt,
          closedAt:
            status === 'done' || status === 'cancelled' ? now : undefined,
        };
      }),
    }));
  };

  const callNext = (clinic?: CreateTicketInput['clinic']): Ticket | undefined => {
    const candidates = data.tickets.filter(
      (ticket) =>
        ticket.status === 'waiting' && (!clinic || ticket.clinic === clinic),
    );
    const next = candidates.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    })[0];
    if (!next) return undefined;
    setTicketStatus(next.id, 'called');
    return next;
  };

  const saveMedicalRecord = (input: MedicalRecordInput): MedicalRecord => {
    const existing = data.records.find((record) => record.ticketId === input.ticketId);
    const recordId = existing?.id ?? uid('rec');
    const record: MedicalRecord = {
      ...input,
      id: recordId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      handedOver: existing?.handedOver ?? false,
    };

    const ticket = data.tickets.find((entry) => entry.id === input.ticketId);
    const clinic = ticket?.clinic ?? 'UM';
    const medicineLines = input.prescription.reduce<Invoice['lines']>((lines, line) => {
      const medicine = data.stockItems.find((item) => item.id === line.itemId);
      if (!medicine) return lines;
      return [
        ...lines,
        {
          label: `${medicine.name} × ${line.quantity}`,
          amount: medicine.price * line.quantity,
        },
      ];
    }, []);
    const invoiceLines: Invoice['lines'] = [
      { label: `Konsultasi ${clinicInfo[clinic].label}`, amount: clinicInfo[clinic].fee },
      { label: 'Administrasi layanan', amount: 5000 },
      ...medicineLines,
    ];

    const now = new Date().toISOString();
    setData((prev) => {
      const existingInvoice = prev.invoices.find((invoice) => invoice.recordId === recordId);
      let invoices = prev.invoices;
      if (!existingInvoice) {
        invoices = [
          ...prev.invoices,
          {
            id: uid('inv'),
            number: nextInvoiceNumber(prev.invoices),
            patientId: input.patientId,
            recordId,
            createdAt: now,
            lines: invoiceLines,
            status: 'open',
          },
        ];
      } else if (existingInvoice.status === 'open') {
        invoices = prev.invoices.map((invoice) =>
          invoice.id === existingInvoice.id
            ? { ...invoice, lines: invoiceLines }
            : invoice,
        );
      }
      return {
        ...prev,
        records: existing
          ? prev.records.map((entry) => (entry.id === recordId ? record : entry))
          : [record, ...prev.records],
        invoices,
        tickets: prev.tickets.map((entry) =>
          entry.id === input.ticketId
            ? { ...entry, status: 'done', closedAt: now }
            : entry,
        ),
      };
    });
    return record;
  };

  const handOverPrescription = (recordId: string): ActionResult => {
    const record = data.records.find((entry) => entry.id === recordId);
    if (!record) return { ok: false, message: 'Resep tidak ditemukan.' };
    if (record.handedOver) return { ok: false, message: 'Resep ini sudah diserahkan.' };
    if (record.prescription.length === 0) {
      return { ok: false, message: 'Resep belum memiliki daftar obat.' };
    }
    for (const line of record.prescription) {
      const item = data.stockItems.find((entry) => entry.id === line.itemId);
      if (!item) {
        return { ok: false, message: 'Ada obat yang tidak ditemukan di gudang.' };
      }
      if (item.stock < line.quantity) {
        return {
          ok: false,
          message: `Stok ${item.name} tidak cukup. Tersedia ${item.stock} ${item.unit}.`,
        };
      }
      if (expiryStatus(item.expiry) === 'expired') {
        return {
          ok: false,
          message: `${item.name} sudah kedaluwarsa. Ganti dengan batch yang masih berlaku.`,
        };
      }
    }
    setData((prev) => ({
      ...prev,
      records: prev.records.map((entry) =>
        entry.id === recordId ? { ...entry, handedOver: true } : entry,
      ),
      stockItems: prev.stockItems.map((item) => {
        const line = record.prescription.find((entry) => entry.itemId === item.id);
        return line ? { ...item, stock: Math.max(0, item.stock - line.quantity) } : item;
      }),
    }));
    return { ok: true };
  };

  const adjustStock = (itemId: string, delta: number): ActionResult => {
    const item = data.stockItems.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'Obat tidak ditemukan.' };
    if (item.stock + delta < 0) {
      return {
        ok: false,
        message: `Stok ${item.name} hanya ${item.stock} ${item.unit}.`,
      };
    }
    setData((prev) => ({
      ...prev,
      stockItems: prev.stockItems.map((entry) =>
        entry.id === itemId ? { ...entry, stock: entry.stock + delta } : entry,
      ),
    }));
    return { ok: true };
  };

  const payInvoice = (invoiceId: string, method: PaymentMethod): ActionResult => {
    const invoice = data.invoices.find((entry) => entry.id === invoiceId);
    if (!invoice) return { ok: false, message: 'Tagihan tidak ditemukan.' };
    if (invoice.status === 'paid') return { ok: false, message: 'Tagihan sudah lunas.' };
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((entry) =>
        entry.id === invoiceId
          ? { ...entry, status: 'paid', method, paidAt: new Date().toISOString() }
          : entry,
      ),
    }));
    return { ok: true };
  };

  const addStaff = (input: StaffInput): ActionResult & { staff?: Staff } => {
    const username = input.username.trim().toLowerCase();
    if (isUsernameTaken(username)) {
      return { ok: false, message: 'Nama pengguna sudah dipakai.' };
    }
    const member: Staff = {
      id: uid('staff'),
      username,
      password: input.password,
      name: input.name.trim(),
      role: input.role,
      clinic: input.clinic,
      active: true,
    };
    setData((prev) => ({ ...prev, staff: [...prev.staff, member] }));
    return { ok: true, staff: member };
  };

  const setStaffActive = (id: string, active: boolean) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((member) =>
        member.id === id ? { ...member, active } : member,
      ),
    }));
  };

  const resetStaffPassword = (id: string): string | undefined => {
    const member = data.staff.find((entry) => entry.id === id);
    if (!member) return undefined;
    const password = 'sehat123';
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((entry) =>
        entry.id === id ? { ...entry, password } : entry,
      ),
    }));
    return password;
  };

  const actions: ClinicActions = {
    registerPatient,
    updatePatient,
    createTicket,
    setTicketStatus,
    callNext,
    saveMedicalRecord,
    handOverPrescription,
    adjustStock,
    payInvoice,
    addStaff,
    setStaffActive,
    resetStaffPassword,
    isUsernameTaken,
  };

  return (
    <ClinicContext.Provider value={{ ...data, actions }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic(): ClinicContextValue {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic harus dipakai di dalam ClinicProvider.');
  }
  return context;
}

export const clinicRoleLabels: Record<StaffRole, string> = {
  administrator: 'Administrator',
  registration: 'Petugas Pendaftaran',
  doctor: 'Dokter',
  nurse: 'Perawat',
  pharmacy: 'Petugas Farmasi',
  cashier: 'Petugas Kasir',
};
