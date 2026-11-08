import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import { colors } from '@/core/theme';
import type { StaffRole } from '@/features/clinic/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const roleMeta: Record<
  StaffRole,
  { label: string; short: string; icon: IconName; color: string; tint: string }
> = {
  administrator: {
    label: 'Administrator',
    short: 'Admin',
    icon: 'shield-checkmark-outline',
    color: colors.ink,
    tint: colors.canvasDeep,
  },
  registration: {
    label: 'Petugas Pendaftaran',
    short: 'Pendaftaran',
    icon: 'id-card-outline',
    color: colors.teal,
    tint: colors.tealSoft,
  },
  doctor: {
    label: 'Dokter',
    short: 'Dokter',
    icon: 'medkit-outline',
    color: colors.blue,
    tint: colors.blueSoft,
  },
  nurse: {
    label: 'Perawat',
    short: 'Perawat',
    icon: 'fitness-outline',
    color: colors.rose,
    tint: colors.roseSoft,
  },
  pharmacy: {
    label: 'Petugas Farmasi',
    short: 'Farmasi',
    icon: 'flask-outline',
    color: colors.violet,
    tint: colors.violetSoft,
  },
  cashier: {
    label: 'Petugas Kasir',
    short: 'Kasir',
    icon: 'wallet-outline',
    color: colors.amber,
    tint: colors.amberSoft,
  },
};

export type DockEntry = {
  href: Href;
  label: string;
  icon: IconName;
  match: string;
};

const dock = {
  home: { href: '/beranda', label: 'Beranda', icon: 'grid-outline', match: '/beranda' },
  queue: { href: '/antrean', label: 'Antrean', icon: 'people-outline', match: '/antrean' },
  patients: { href: '/pasien', label: 'Pasien', icon: 'id-card-outline', match: '/pasien' },
  menu: { href: '/menu', label: 'Menu', icon: 'apps-outline', match: '/menu' },
  profile: { href: '/profil', label: 'Profil', icon: 'person-outline', match: '/profil' },
  exams: { href: '/periksa', label: 'Periksa', icon: 'medkit-outline', match: '/periksa' },
  stock: { href: '/farmasi', label: 'Stok', icon: 'flask-outline', match: '/farmasi' },
  prescriptions: {
    href: '/farmasi/resep',
    label: 'Resep',
    icon: 'document-text-outline',
    match: '/farmasi/resep',
  },
  bills: { href: '/kasir', label: 'Tagihan', icon: 'wallet-outline', match: '/kasir' },
  history: {
    href: '/kasir/riwayat',
    label: 'Riwayat',
    icon: 'receipt-outline',
    match: '/kasir/riwayat',
  },
} satisfies Record<string, DockEntry>;

export const dockByRole: Record<StaffRole, DockEntry[]> = {
  administrator: [dock.home, dock.queue, dock.patients, dock.menu, dock.profile],
  registration: [dock.home, dock.queue, dock.patients, dock.profile],
  doctor: [dock.home, dock.queue, dock.exams, dock.profile],
  nurse: [dock.home, dock.queue, dock.exams, dock.profile],
  pharmacy: [dock.home, dock.stock, dock.prescriptions, dock.profile],
  cashier: [dock.home, dock.bills, dock.history, dock.profile],
};

const ALL_ROLES: StaffRole[] = [
  'administrator',
  'registration',
  'doctor',
  'nurse',
  'pharmacy',
  'cashier',
];

const accessRules: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: '/beranda', roles: ALL_ROLES },
  { prefix: '/menu', roles: ALL_ROLES },
  { prefix: '/profil', roles: ALL_ROLES },
  { prefix: '/antrean/ambil', roles: ['administrator', 'registration'] },
  { prefix: '/antrean/display', roles: ['administrator', 'registration', 'doctor', 'nurse'] },
  { prefix: '/antrean', roles: ['administrator', 'registration', 'doctor', 'nurse'] },
  { prefix: '/pasien/daftar', roles: ['administrator', 'registration'] },
  { prefix: '/pasien', roles: ['administrator', 'registration', 'doctor', 'nurse'] },
  { prefix: '/periksa', roles: ['administrator', 'doctor', 'nurse'] },
  { prefix: '/farmasi', roles: ['administrator', 'pharmacy'] },
  { prefix: '/kasir', roles: ['administrator', 'cashier'] },
  { prefix: '/laporan', roles: ['administrator'] },
  { prefix: '/pengguna', roles: ['administrator'] },
];

export function hasAccess(role: StaffRole, path: string): boolean {
  if (role === 'administrator') return true;
  const match = [...accessRules]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`));
  return match ? match.roles.includes(role) : false;
}

export type ModuleGroup = 'Pelayanan' | 'Manajemen' | 'Akun';

export type ModuleLink = {
  path: string;
  href: Href;
  label: string;
  description: string;
  icon: IconName;
  group: ModuleGroup;
  color: string;
  tint: string;
};

export const moduleCatalog: ModuleLink[] = [
  {
    path: '/pasien',
    href: '/pasien',
    label: 'Pasien',
    description: 'Data induk, riwayat kunjungan & kartu pasien',
    icon: 'id-card-outline',
    group: 'Pelayanan',
    color: colors.teal,
    tint: colors.tealSoft,
  },
  {
    path: '/antrean',
    href: '/antrean',
    label: 'Antrean',
    description: 'Nomor otomatis, pemanggilan & display ruang',
    icon: 'people-outline',
    group: 'Pelayanan',
    color: colors.blue,
    tint: colors.blueSoft,
  },
  {
    path: '/periksa',
    href: '/periksa',
    label: 'Pemeriksaan',
    description: 'Rekam medis elektronik & resep digital',
    icon: 'medkit-outline',
    group: 'Pelayanan',
    color: colors.rose,
    tint: colors.roseSoft,
  },
  {
    path: '/farmasi',
    href: '/farmasi',
    label: 'Farmasi',
    description: 'Stok obat, resep masuk & penyerahan',
    icon: 'flask-outline',
    group: 'Pelayanan',
    color: colors.violet,
    tint: colors.violetSoft,
  },
  {
    path: '/kasir',
    href: '/kasir',
    label: 'Kasir',
    description: 'Tagihan, pembayaran & riwayat transaksi',
    icon: 'wallet-outline',
    group: 'Pelayanan',
    color: colors.amber,
    tint: colors.amberSoft,
  },
  {
    path: '/laporan',
    href: '/laporan',
    label: 'Laporan',
    description: 'Kunjungan, penyakit, obat & kinerja petugas',
    icon: 'bar-chart-outline',
    group: 'Manajemen',
    color: colors.teal,
    tint: colors.tealSoft,
  },
  {
    path: '/pengguna',
    href: '/pengguna',
    label: 'Pengguna',
    description: 'Akun staf, peran & status akses',
    icon: 'shield-checkmark-outline',
    group: 'Manajemen',
    color: colors.ink,
    tint: colors.canvasDeep,
  },
  {
    path: '/profil',
    href: '/profil',
    label: 'Profil & pengaturan',
    description: 'Identitas akun, panduan peran & sesi',
    icon: 'person-outline',
    group: 'Akun',
    color: colors.muted,
    tint: colors.canvasDeep,
  },
];

export type QuickAction = {
  href: Href;
  label: string;
  icon: IconName;
  color: string;
  tint: string;
};

export const quickActionsByRole: Record<StaffRole, QuickAction[]> = {
  administrator: [
    {
      href: '/pasien/daftar',
      label: 'Daftarkan pasien',
      icon: 'person-add-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
    {
      href: '/antrean/ambil',
      label: 'Ambil nomor',
      icon: 'ticket-outline',
      color: colors.blue,
      tint: colors.blueSoft,
    },
    {
      href: '/laporan',
      label: 'Lihat laporan',
      icon: 'bar-chart-outline',
      color: colors.violet,
      tint: colors.violetSoft,
    },
    {
      href: '/pengguna',
      label: 'Kelola pengguna',
      icon: 'shield-checkmark-outline',
      color: colors.amber,
      tint: colors.amberSoft,
    },
  ],
  registration: [
    {
      href: '/pasien/daftar',
      label: 'Daftarkan pasien',
      icon: 'person-add-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
    {
      href: '/antrean/ambil',
      label: 'Ambil nomor',
      icon: 'ticket-outline',
      color: colors.blue,
      tint: colors.blueSoft,
    },
    {
      href: '/pasien',
      label: 'Cari pasien',
      icon: 'search-outline',
      color: colors.violet,
      tint: colors.violetSoft,
    },
  ],
  doctor: [
    {
      href: '/antrean',
      label: 'Antrean saya',
      icon: 'people-outline',
      color: colors.blue,
      tint: colors.blueSoft,
    },
    {
      href: '/periksa',
      label: 'Pemeriksaan',
      icon: 'medkit-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
    {
      href: '/pasien',
      label: 'Data pasien',
      icon: 'id-card-outline',
      color: colors.violet,
      tint: colors.violetSoft,
    },
  ],
  nurse: [
    {
      href: '/antrean',
      label: 'Antrean',
      icon: 'people-outline',
      color: colors.blue,
      tint: colors.blueSoft,
    },
    {
      href: '/periksa',
      label: 'Pemeriksaan',
      icon: 'medkit-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
    {
      href: '/pasien',
      label: 'Data pasien',
      icon: 'id-card-outline',
      color: colors.violet,
      tint: colors.violetSoft,
    },
  ],
  pharmacy: [
    {
      href: '/farmasi/resep',
      label: 'Resep masuk',
      icon: 'document-text-outline',
      color: colors.violet,
      tint: colors.violetSoft,
    },
    {
      href: '/farmasi',
      label: 'Stok obat',
      icon: 'flask-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
  ],
  cashier: [
    {
      href: '/kasir',
      label: 'Tagihan aktif',
      icon: 'wallet-outline',
      color: colors.amber,
      tint: colors.amberSoft,
    },
    {
      href: '/kasir/riwayat',
      label: 'Riwayat bayar',
      icon: 'receipt-outline',
      color: colors.teal,
      tint: colors.tealSoft,
    },
  ],
};

export const roleGuide: Record<StaffRole, string[]> = {
  administrator: [
    'Pantau seluruh modul, antrean, dan ringkasan layanan dari beranda.',
    'Kelola akun staf serta reset kata sandi melalui menu Pengguna.',
    'Tinjau laporan kunjungan, diagnosis, dan penggunaan obat.',
  ],
  registration: [
    'Daftarkan pasien baru lewat wizard tiga langkah dengan validasi NIK.',
    'Ambil nomor antrean berdasarkan poli dan tingkat prioritas.',
    'Gunakan display antrean untuk memantau panggilan di ruang tunggu.',
  ],
  doctor: [
    'Mulai pemeriksaan dari daftar antrean atau menu Pemeriksaan.',
    'Isi anamnesis, tanda vital, diagnosis, lalu tulis resep elektronik.',
    'Menyimpan EMR otomatis menutup antrean dan membuat tagihan.',
  ],
  nurse: [
    'Bantu memantau antrean dan menyiapkan pasien untuk pemeriksaan.',
    'Lengkapi tanda vital pada EMR bila dokter membutuhkan.',
    'Gunakan data pasien untuk memverifikasi identitas sebelum tindakan.',
  ],
  pharmacy: [
    'Pantau resep masuk dan serahkan obat setelah stok diverifikasi.',
    'Gunakan tombol tambah pada stok untuk penerimaan atau pengeluaran.',
    'Perhatikan label menipis dan kedaluwarsa sebelum menyerahkan obat.',
  ],
  cashier: [
    'Buka tagihan aktif, periksa rincian, lalu pilih metode pembayaran.',
    'Semua transaksi lunas tersimpan pada riwayat pembayaran.',
    'Gunakan metode BPJS untuk klaim jaminan pasien.',
  ],
};
