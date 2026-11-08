const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const pad = (value: number) => String(value).padStart(2, '0');

export function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function dateKey(input: string | Date = new Date()): string {
  const date = toDate(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isToday(input: string | Date): boolean {
  return dateKey(input) === dateKey(new Date());
}

export function formatLongDate(input: string | Date = new Date()): string {
  const date = toDate(input);
  return `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDate(input: string | Date): string {
  if (!input) return '—';
  const date = toDate(input);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(input: string | Date): string {
  if (!input) return '—';
  const date = toDate(input);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatTime(input: string | Date): string {
  const date = toDate(input);
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

export function formatDateTime(input: string | Date): string {
  const date = toDate(input);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} · ${formatTime(date)}`;
}

export function formatDateTimeLong(input: string | Date): string {
  const date = toDate(input);
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function greeting(input: Date = new Date()): string {
  const hour = input.getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiah(value: number): string {
  const sign = value < 0 ? '−' : '';
  return `${sign}Rp ${formatNumber(Math.abs(value))}`;
}

export function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (value >= 10_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }
  return formatRupiah(value);
}

export function initials(name: string): string {
  const cleaned = name
    .replace(/\b(dr|drg|Ns|S\.Kep|S\.Farm|Apt|S\.E|M\.M)\.?\b/gi, '')
    .replace(/[.,]/g, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function maskedNik(nik: string): string {
  if (nik.length < 10) return nik;
  return `${nik.slice(0, 6)}••••${nik.slice(-4)}`;
}

export function ageFromBirthDate(birthDate: string): number {
  const birth = toDate(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function waitLabel(minutes: number): string {
  if (minutes <= 0) return 'Segera dipanggil';
  if (minutes < 60) return `± ${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `± ${hours} jam ${rest} menit` : `± ${hours} jam`;
}

export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function isoDateAfterDays(days: number): string {
  return dateKey(addDays(new Date(), days));
}

export function expiryStatus(expiry: string): 'expired' | 'soon' | 'safe' {
  const [year, month] = expiry.split('-').map(Number);
  if (!year || !month) return 'safe';
  const now = new Date();
  const expiryEnd = new Date(year, month, 0, 23, 59, 59);
  const soonLimit = addDays(new Date(now.getFullYear(), now.getMonth(), 1), 75);
  if (expiryEnd < now) return 'expired';
  if (expiryEnd <= soonLimit) return 'soon';
  return 'safe';
}

export function expiryLabel(expiry: string): string {
  const [year, month] = expiry.split('-');
  if (!year || !month) return '—';
  return `ED ${month}/${year.slice(-2)}`;
}

export function percent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

export function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value;
}
