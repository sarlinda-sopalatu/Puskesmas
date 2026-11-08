import { expiryStatus } from '@/core/format';
import { colors } from '@/core/theme';
import type {
  ClinicCode,
  Coverage,
  Invoice,
  MedicalRecord,
  StockGroup,
  StockItem,
  Ticket,
  TicketStatus,
} from './types';

export const clinicOrder: ClinicCode[] = ['UM', 'GG', 'AN', 'KI', 'TB'];

type ClinicMeta = {
  code: ClinicCode;
  label: string;
  short: string;
  description: string;
  room: string;
  fee: number;
  color: string;
  tint: string;
  icon: 'medkit-outline' | 'medical-outline' | 'happy-outline' | 'heart-outline' | 'pulse-outline';
};

export const clinicInfo: Record<ClinicCode, ClinicMeta> = {
  UM: {
    code: 'UM',
    label: 'Poli Umum',
    short: 'Umum',
    description: 'Pemeriksaan umum & tindakan dasar',
    room: 'Ruang 1',
    fee: 25000,
    color: colors.teal,
    tint: colors.tealSoft,
    icon: 'medkit-outline',
  },
  GG: {
    code: 'GG',
    label: 'Poli Gigi',
    short: 'Gigi',
    description: 'Kesehatan gigi & mulut',
    room: 'Ruang 2',
    fee: 30000,
    color: colors.blue,
    tint: colors.blueSoft,
    icon: 'medical-outline',
  },
  AN: {
    code: 'AN',
    label: 'Poli Anak',
    short: 'Anak',
    description: 'Tumbuh kembang & imunisasi',
    room: 'Ruang 3',
    fee: 25000,
    color: colors.amber,
    tint: colors.amberSoft,
    icon: 'happy-outline',
  },
  KI: {
    code: 'KI',
    label: 'Poli KIA',
    short: 'KIA',
    description: 'Ibu hamil, nifas & KB',
    room: 'Ruang 4',
    fee: 20000,
    color: colors.rose,
    tint: colors.roseSoft,
    icon: 'heart-outline',
  },
  TB: {
    code: 'TB',
    label: 'Poli TB Paru',
    short: 'TB',
    description: 'Pemeriksaan & pengobatan TB',
    room: 'Ruang 5',
    fee: 20000,
    color: colors.violet,
    tint: colors.violetSoft,
    icon: 'pulse-outline',
  },
};

export type StatusTone = 'amber' | 'teal' | 'green' | 'rose';

export const ticketStatusInfo: Record<
  TicketStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  waiting: { label: 'Menunggu', tone: 'amber', description: 'Belum dipanggil' },
  called: { label: 'Dipanggil', tone: 'teal', description: 'Sedang menuju ruang' },
  done: { label: 'Selesai', tone: 'green', description: 'Pelayanan selesai' },
  cancelled: { label: 'Dibatalkan', tone: 'rose', description: 'Antrean dibatalkan' },
};

export const coverageInfo: Record<
  Coverage,
  { label: string; tone: 'blue' | 'neutral'; description: string }
> = {
  BPJS: { label: 'BPJS', tone: 'blue', description: 'Jaminan kesehatan nasional' },
  Umum: { label: 'Umum', tone: 'neutral', description: 'Pembayaran mandiri' },
};

export const stockGroups: StockGroup[] = [
  'Analgesik',
  'Antibiotik',
  'Antihistamin',
  'Vitamin',
  'Cairan',
  'Antiseptik',
  'Metabolik',
  'Kortikosteroid',
];

export function isActiveTicket(ticket: Ticket): boolean {
  return ticket.status === 'waiting' || ticket.status === 'called';
}

export function sortTickets(tickets: Ticket[]): Ticket[] {
  const statusWeight: Record<TicketStatus, number> = {
    called: 0,
    waiting: 1,
    done: 2,
    cancelled: 3,
  };
  return [...tickets].sort((a, b) => {
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function nextWaitingTicket(tickets: Ticket[]): Ticket | undefined {
  return [...tickets]
    .filter((ticket) => ticket.status === 'waiting')
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    })[0];
}

export function invoiceTotal(invoice: Invoice): number {
  return invoice.lines.reduce((total, line) => total + line.amount, 0);
}

export function isStockLow(item: StockItem): boolean {
  return item.stock <= item.minStock;
}

export function isStockExpired(item: StockItem): boolean {
  return expiryStatus(item.expiry) === 'expired';
}

export function isStockExpiringSoon(item: StockItem): boolean {
  return expiryStatus(item.expiry) === 'soon';
}

export function prescriptionTotal(
  record: MedicalRecord,
  stockItems: StockItem[],
): number {
  return record.prescription.reduce((total, line) => {
    const item = stockItems.find((entry) => entry.id === line.itemId);
    return total + (item ? item.price * line.quantity : 0);
  }, 0);
}

export function recordHasStockIssue(
  record: MedicalRecord,
  stockItems: StockItem[],
): boolean {
  return record.prescription.some((line) => {
    const item = stockItems.find((entry) => entry.id === line.itemId);
    if (!item) return true;
    if (item.stock < line.quantity) return true;
    return expiryStatus(item.expiry) === 'expired';
  });
}

export function stockUsage(stockItems: StockItem[]): number {
  return stockItems.reduce((total, item) => total + item.stock, 0);
}
