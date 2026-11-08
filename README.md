<p align="center">
  <img src="./assets/images/icon.png" width="96" height="96" alt="Ikon Puskesmas Mobile" />
</p>

<h1 align="center">Puskesmas Mobile</h1>

<p align="center">
  Aplikasi demo layanan puskesmas terpadu untuk pendaftaran, antrean, rekam medis,
  farmasi, pembayaran, laporan, dan manajemen pengguna.
</p>

<p align="center">
  Expo SDK 58 · React Native · TypeScript · Expo Router
</p>

---

## Tentang aplikasi

**Puskesmas Mobile** adalah prototipe aplikasi operasional puskesmas berbasis
Expo. Aplikasi ini menghadirkan satu alur kerja dari pasien datang hingga
tagihan lunas, dengan tampilan yang disesuaikan untuk tiap peran petugas.

Antarmuka memakai sistem visual **Warm Teal**: kanvas krem, navy pekat, teal
sebagai aksen utama, coral untuk urgensi, dock navigasi mengapung, kartu tiket
dengan sobekan, dashboard bento, lembar bawah, dan tabel buku besar. Seluruh
salinan antarmuka dan dokumentasi ditulis dalam bahasa Indonesia.

> **Catatan:** ini adalah demo front-end, bukan sistem produksi. Seluruh data
> pasien, staf, obat, dan transaksi adalah data contoh. Jangan digunakan untuk
> menyimpan data kesehatan nyata.

## Sorotan

- **Enam peran dengan RBAC** — administrator, pendaftaran, dokter, perawat,
  farmasi, dan kasir. Menu, dock, route guard, dan konten dashboard mengikuti
  peran yang sedang masuk.
- **Satu alur layanan utuh** — pendaftaran pasien → pengambilan nomor →
  pemanggilan → rekam medis → resep → serah terima obat → pembayaran → laporan.
- **EMR empat langkah** — keluhan, tanda vital, diagnosis & rencana, lalu resep.
  Validasi dilakukan per langkah dan ringkasan kunjungan dapat dibagikan.
- **Aturan bisnis konsisten** — EMR menutup antrean dan menyinkronkan tagihan;
  tagihan lunas mengunci EMR; serah terima obat memvalidasi stok dan kedaluwarsa.
- **Farmasi dan kasir operasional** — penyesuaian stok, antrean resep,
  pembayaran tunai/BPJS/transfer, kuitansi, dan riwayat transaksi.
- **Laporan manajemen** — filter hari ini/7 hari/30 hari, agregat kunjungan,
  diagnosis, metode bayar, obat, stok kritis, dan ekspor teks lewat share sheet.
- **Dokumentasi lengkap** — praktik Scrum, design system, dan checklist QA
  tersedia di folder [`docs`](./docs).

## Peran dan akses

| Peran | Akun demo | Cakupan utama |
| --- | --- | --- |
| Administrator | `admin` | Semua modul, laporan, dan manajemen pengguna |
| Petugas Pendaftaran | `loket` | Pasien, pendaftaran, antrean, dan display |
| Dokter | `dokter`, `doktergigi` | Antrean poli sendiri dan EMR |
| Perawat | `perawat` | Antrean, data pasien, dan EMR |
| Petugas Farmasi | `apoteker` | Stok obat, resep masuk, dan serah terima |
| Petugas Kasir | `kasir` | Tagihan aktif, pembayaran, dan riwayat |

Administrator melewati seluruh pemeriksaan modul. Pengguna nonaktif tidak dapat
masuk meskipun kredensialnya benar. Dokter hanya melihat antrean poli yang
ditugaskan kepadanya, tetapi tetap dapat membuka kembali EMR yang ia tulis.

## Alur layanan

```text
Pendaftaran pasien
      ↓
Pengambilan nomor + prioritas
      ↓
Antrean & pemanggilan
      ↓
EMR: keluhan → tanda vital → diagnosis → resep
      ↓
Tagihan otomatis dibuat / diperbarui
      ↓
Serah terima obat (validasi stok)
      ↓
Pembayaran & kuitansi
      ↓
Laporan manajemen
```

Status antrean: `Menunggu` → `Dipanggil` → `Selesai`, atau `Dibatalkan`.
Nomor dibuat per poli dengan format `UM-001`, `GG-001`, dan seterusnya.
Pasien prioritas dipanggil lebih dahulu, lalu urut waktu pendaftaran.

## Modul dan route

| Route | Modul | Keterangan |
| --- | --- | --- |
| `/login` | Masuk | Login staf dan pintasan akun demo |
| `/beranda` | Beranda | Ringkasan peran, antrean berjalan, aksi cepat |
| `/antrean` | Antrean | Papan antrean, filter poli/status, panggil berikutnya |
| `/antrean/ambil` | Ambil nomor | Cari pasien, pilih poli, prioritas, pratinjau tiket |
| `/antrean/[id]` | Detail antrean | Status, perjalanan tiket, tindakan petugas |
| `/antrean/display` | Display ruang | Layar publik pemanggilan antrean |
| `/pasien` | Pasien | Direktori, pencarian, filter jaminan |
| `/pasien/daftar` | Pasien baru | Form tiga langkah; juga dipakai untuk mengubah data |
| `/pasien/[id]` | Profil pasien | Identitas, riwayat kunjungan, tagihan, kartu pasien |
| `/periksa` | Pemeriksaan | Worklist aktif dan EMR selesai |
| `/periksa/[id]` | Rekam medis | Form empat langkah, resep, simpan, bagikan ringkasan |
| `/farmasi` | Farmasi | Buku stok, peringatan stok/kedaluwarsa, penyesuaian |
| `/farmasi/resep` | Resep masuk | Antrean resep dan konfirmasi serah terima |
| `/kasir` | Kasir | Tagihan terbuka, rincian akordeon, pembayaran |
| `/kasir/riwayat` | Riwayat bayar | Transaksi lunas per tanggal dan kuitansi |
| `/laporan` | Laporan | Agregat periode dan ekspor melalui share sheet |
| `/pengguna` | Pengguna | Daftar staf, status aktif, reset kata sandi |
| `/pengguna/tambah` | Tambah akun | Validasi akun baru dan ringkasan kredensial |
| `/menu` | Menu | Katalog modul sesuai peran |
| `/profil` | Profil | Identitas, panduan peran, dan keluar |

## Menjalankan di Expo Go

### Prasyarat

- Node.js LTS dan npm.
- Aplikasi **Expo Go** di perangkat Android/iOS yang mendukung **Expo SDK 58**.
- Perangkat dan komputer berada di jaringan Wi-Fi yang sama (atau gunakan
  tunnel).

### Langkah

```bash
cd D:\projek\puskesmas
npm install
npx expo start
```

1. Terminal menampilkan QR code.
2. Di Android, buka Expo Go lalu pindai QR code.
3. Di iOS, pindai QR code dengan aplikasi Camera, lalu pilih Expo Go.
4. Jika jaringan lokal memblokir koneksi, jalankan `npx expo start --tunnel`.

Aplikasi tidak memakai modul native kustom, sehingga tidak memerlukan
development build. Untuk menjalankan versi web saat pengembangan:

```bash
npx expo start --web
```

## Akun demo

| Nama pengguna | Kata sandi | Peran | Status |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Aktif |
| `loket` | `123456` | Petugas Pendaftaran | Aktif |
| `dokter` | `123456` | Dokter Poli Umum | Aktif |
| `doktergigi` | `123456` | Dokter Poli Gigi | Aktif |
| `perawat` | `123456` | Perawat | Aktif |
| `apoteker` | `123456` | Petugas Farmasi | Aktif |
| `kasir` | `123456` | Petugas Kasir | Aktif |
| `dimas` | `123456` | Petugas Pendaftaran | Nonaktif — ditolak saat login |

Halaman login sudah mengisi `loket` / `123456` dan menyediakan pintasan akun
demo. Logout dilakukan dari **Profil → Keluar dari akun**.

## Skenario demo 5 menit

1. Masuk sebagai **`loket`**, buat pasien baru, lalu ambil nomor untuk Poli Umum.
2. Keluar dan masuk sebagai **`dokter`**. Buka antrean aktif, isi EMR empat
   langkah, tambahkan obat, lalu simpan.
3. Masuk sebagai **`apoteker`**, tinjau resep, cek stok, dan lakukan serah
   terima. Jumlah stok akan berkurang.
4. Masuk sebagai **`kasir`**, buka tagihan terkait, pilih metode pembayaran,
   lalu bagikan kuitansi. Transaksi pindah ke riwayat.
5. Masuk sebagai **`admin`**, buka **Laporan** untuk melihat agregat terbaru,
   lalu tinjau **Pengguna** dan **Menu**.

Data klinik berada di memori selama aplikasi berjalan sehingga perubahan antar
peran langsung terlihat. **Memuat ulang aplikasi akan mengembalikan seluruh
data contoh**, sedangkan sesi staf terakhir disimpan di AsyncStorage.

## Struktur proyek

```text
puskesmas/
├─ src/
│  ├─ app/                    # Route tipis Expo Router
│  │  ├─ (main)/              # Area terautentikasi + dock
│  │  ├─ login.tsx
│  │  ├─ _layout.tsx
│  │  └─ +not-found.tsx
│  ├─ components/
│  │  ├─ layout/              # AppPage, TopBar, dock, heading
│  │  └─ ui/                  # Button, field, tag, sheet, ticket, dll.
│  ├─ core/
│  │  ├─ format.ts            # Format tanggal, Rupiah, NIK, validasi
│  │  ├─ navigation.ts        # Role meta, dock, katalog, access rules
│  │  └─ theme.ts             # Token Warm Teal
│  └─ features/
│     ├─ auth/                # Sesi staf
│     └─ clinic/              # Tipe, seed, selector, aksi, kuitansi
├─ assets/images/             # Ikon, splash, favicon hasil brand generator
├─ docs/
│  ├─ SCRUM.md
│  ├─ DESIGN-SYSTEM.md
│  └─ QA-CHECKLIST.md
├─ scripts/generate-brand-assets.ps1
├─ app.json
└─ package.json
```

Route hanya mengurus komposisi layar. Logika domain, data, navigasi, dan
komponen bersama berada di luar folder route agar mudah diuji dan digunakan
ulang.

## Arsitektur data dan aturan bisnis

Seluruh state klinik berada di `ClinicProvider` dan diinisialisasi dari
`createSeedData()`. Tidak ada backend atau database pada demo ini.

- **Pasien** memiliki nomor rekam medis berurutan dan validasi NIK, tanggal,
  kontak, serta jaminan.
- **Antrean** bernomor per poli. Prioritas didahulukan; estimasi menyesuaikan
  jumlah antrean menunggu.
- **Display antrean** memperbarui panggilan aktif dan daftar tunggu tanpa
  menyimpan data baru.
- **EMR** menyimpan satu record per tiket. Menyimpan EMR menutup tiket,
  mempertahankan ID record, dan membuat tagihan terbuka atau memperbarui baris
  tagihan yang belum dibayar.
- **Penguncian EMR** aktif setelah tagihan terkait lunas. Setelah obat
  diserahkan, bagian resep terkunci tetapi catatan klinis masih dapat diubah.
- **Farmasi** memeriksa ketersediaan stok dan tanggal kedaluwarsa sebelum
  mengurangi stok. Penyesuaian manual tidak boleh menghasilkan stok negatif.
- **Pembayaran** menerima Tunai, BPJS, atau Transfer. Tunai memerlukan nominal
  yang cukup. Metode dan waktu bayar disimpan pada tagihan.
- **Pengguna** tidak dapat menonaktifkan akunnya sendiri. Reset kata sandi
  menghasilkan `sehat123`; nama pengguna dijaga unik.
- **Sesi** staf aktif disimpan di AsyncStorage dengan kunci
  `puskesmas.session.staff`. Data klinik lain tidak dipersistenkan.

## Kualitas dan verifikasi

Quality gate yang dipakai sebelum demo:

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | Lolos, 0 error |
| ESLint | `npx expo lint` | Lolos, 0 error dan 0 warning |
| Bundel web | `npx expo export --platform web` | Lolos, seluruh route ter-bundel |
| Diagnostik Expo | `npx expo-doctor` | ✅ 20/20 checks passed dengan mode offline |

Pemeriksaan manual untuk semua peran, termasuk kasus kosong, validasi, dan
penguncian, tercatat di [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md). Pada
tanggal 8 November 2026, uji utama alur telah dijalankan melalui Chrome headless
di web; uji perangkat Expo Go dan native share masih perlu dilengkapi.

## Dokumentasi

- [`docs/SCRUM.md`](./docs/SCRUM.md) — visi produk, backlog, lima sprint
  dua minggu, upacara Scrum, definition of done, metrik, risiko, dan keputusan.
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — fondasi merek, token,
  tipografi, komponen, pola layar, aksesibilitas, dan panduan kontribusi.
- [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md) — matriks pengujian per
  peran dan alur, kasus negatif, serta status verifikasi.

## Batasan dan langkah produksi

Demo ini belum menyertakan backend, autentikasi terenkripsi, audit trail,
sinkronisasi SIMPUS/BPJS, manajemen batch obat, atau notifikasi. Sebelum dipakai
di fasilitas nyata, diperlukan minimal:

1. API dan basis data dengan enkripsi serta kontrol akses server-side.
2. Autentikasi kuat, kebijakan kata sandi, rotasi sesi, dan audit log.
3. Integrasi BPJS/SIMPUS dan validasi ketersediaan obat per batch.
4. Pengujian perangkat fisik, screen reader, dan uji beban.
5. Persetujuan klinis atas alur, istilah, dan format rekam medis.

---

Dibangun dengan Expo, React Native, TypeScript, dan Expo Router. Aset merek
dibuat khusus untuk proyek ini melalui `scripts/generate-brand-assets.ps1`.
