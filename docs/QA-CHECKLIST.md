# Checklist QA — Puskesmas Mobile

**Produk:** Puskesmas Mobile  
**Versi:** 1.0.0 (demo)  
**Tanggal verifikasi:** 8 November 2026  
**Platform target:** Expo Go (Android/iOS), web sebagai target build  
**Status dokumen:** hasil uji otomatis dan uji web manual; uji perangkat fisik masih perlu dilengkapi

> Checklist ini membedakan tiga tingkat bukti: **otomatis** (typecheck, lint,
> export), **web manual** (alur di browser), dan **perangkat fisik** (Expo Go,
> share sheet, safe area, keyboard). Jangan menandai sebuah kasus “lolos” hanya
> karena kode terlihat benar.

---

## 1. Ringkasan hasil

| Pemeriksaan | Perintah / metode | Hasil |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | ✅ Lolos, 0 error |
| ESLint | `npx expo lint` | ✅ Lolos, 0 error, 0 warning |
| Bundel web | `npx expo export --platform web` | ✅ Lolos, seluruh route ter-bundel |
| Expo Doctor | `npx expo-doctor` | ✅ 20/20 checks passed dengan mode offline; tidak ada issue pada konfigurasi |
| Uji alur web | Browser desktop, server Expo web via Chrome headless | ✅ Autentikasi/RBAC, antrean, EMR, farmasi, pembayaran, dan 404 telah diuji; logout via Alert web masih menunggu uji native |
| Uji Expo Go native | Perangkat Android/iOS | ⬜ Belum dijalankan pada perangkat fisik |
| Uji share sheet | Native share | ⬜ Belum dijalankan pada perangkat fisik |

### Environment

| Item | Nilai |
| --- | --- |
| OS | Windows 11 |
| Node.js | 22.18.0 |
| npm | 11.1.0 |
| Expo SDK | ~58.0.23 |
| React Native | 0.88.1 |
| React | 19.3.0 |
| TypeScript | ~6.0.3 |
| Expo Router | ~58.0.30 |
| Browser QA | Web build React Native Web |

### Legenda status

| Simbol | Arti |
| --- | --- |
| ✅ | Dijalankan dan sesuai harapan |
| 🟡 | Terverifikasi sebagian; memerlukan uji tambahan di perangkat |
| ⬜ | Belum dijalankan |
| ❌ | Gagal, perlu perbaikan |
| ➖ | Tidak berlaku untuk platform ini |

---

## 2. Data awal dan precondition

Model data demo di-reset setiap aplikasi dimuat ulang. Sesi staf terakhir
disimpan di AsyncStorage, sehingga pengguna dapat kembali ke beranda setelah
reload. Untuk memulai skenario bersih:

1. Keluar dari akun, lalu muat ulang aplikasi.
2. Pastikan halaman login tampil.
3. Gunakan satu sesi browser yang sama selama pengujian agar perubahan antarperan
   terlihat.

| Data | Jumlah / kondisi awal |
| --- | --- |
| Staf | 8 akun: 7 aktif, 1 nonaktif (`dimas`) |
| Pasien | 8 pasien contoh |
| Tiket | 8 tiket; 1 dipanggil (`UM-001`), 5 menunggu, 2 selesai |
| EMR | 2 record; `rec-001` (TB) belum diserahkan, `rec-002` (UM) sudah diserahkan |
| Obat | 14 item; 5 item pada/di bawah stok minimum; 1 item kedaluwarsa |
| Tagihan | 5 tagihan; 2 terbuka (`INV-...-0001`, `INV-...-0005`), 3 lunas |
| Resep menunggu | 1 resep (`rec-001`) |
| Poli | UM, GG, AN, KI, TB |

### Akun uji

| Username | Password | Peran | Ekspektasi |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Semua modul terbuka |
| `loket` | `123456` | Pendaftaran | Pasien dan antrean |
| `dokter` | `123456` | Dokter UM | Worklist UM dan EMR |
| `doktergigi` | `123456` | Dokter GG | Worklist GG dan EMR |
| `perawat` | `123456` | Perawat | Antrean, pasien, EMR |
| `apoteker` | `123456` | Farmasi | Stok dan resep |
| `kasir` | `123456` | Kasir | Tagihan dan riwayat |
| `dimas` | `123456` | Pendaftaran (nonaktif) | Ditolak dengan pesan akun nonaktif |

---

## 3. Uji autentikasi dan RBAC

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Login valid | Masuk sebagai `admin` / `admin123` | Beranda admin tampil; nama dan peran benar; dock admin muncul | ✅ |
| AUTH-02 | Login setiap peran | Ulangi untuk `loket`, `dokter`, `perawat`, `apoteker`, `kasir` | Setiap peran masuk ke beranda dengan dock dan konten yang sesuai | ✅ |
| AUTH-03 | Password salah | Masukkan `loket` dengan password salah | Pesan kesalahan inline; tidak ada sesi yang dibuat | ✅ |
| AUTH-04 | Akun nonaktif | Masuk sebagai `dimas` / `123456` | Ditolak; pesan menjelaskan akun nonaktif/tidak dapat digunakan | ✅ |
| AUTH-05 | Sesi dan logout | Login, reload halaman, lalu logout dari Profil | Reload tetap masuk; logout kembali ke login dan menghapus sesi | 🟡 |
| RBAC-01 | Route terlarang | Login `kasir`, buka `/laporan` secara langsung | Access Denied; tidak ada data laporan yang terbuka | ✅ |
| RBAC-02 | Dock per peran | Bandingkan dock pada tiap akun | Dock hanya memuat modul yang relevan | ✅ |
| RBAC-03 | Menu per peran | Buka `/menu` pada akun non-admin | Modul yang tidak berhak tidak tampil | ⬜ |
| RBAC-04 | Akses tanpa sesi | Buka `/beranda` tanpa login | Dialihkan ke halaman login | ✅ |
| RBAC-05 | Akses admin laporan | Login `admin`, buka `/laporan` | Laporan tampil; metrik dan tombol ekspor benar | ✅ |

---

## 4. Uji pasien dan pendaftaran

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| PAT-01 | Cari pasien | Di `/pasien`, cari nama, NIK, dan nomor RM | Hasil menyaring dengan benar; hitungan filter jaminan konsisten | ⬜ |
| PAT-02 | Filter jaminan | Pilih Semua/BPJS/Umum | Hanya pasien dengan jaminan yang dipilih tampil | ⬜ |
| PAT-03 | Validasi form | Buat pasien dengan field kosong, NIK < 16 digit, dan tanggal invalid | Pesan per field muncul; data tidak tersimpan | ⬜ |
| PAT-04 | Tambah pasien | Isi form tiga langkah dengan data valid | Pasien baru muncul; nomor RM berurutan; toast/hasil sukses jelas | ⬜ |
| PAT-05 | Ubah pasien | Buka pasien, pilih ubah, ganti telepon | Data berubah; nomor RM dan ID tidak berubah | ⬜ |
| PAT-06 | Detail pasien | Buka profil pasien berisi riwayat kunjungan dan tagihan | Informasi identitas, riwayat, dan tagihan tampil konsisten | ⬜ |
| PAT-07 | Hak edit | Login dokter, buka detail pasien | Dokter dapat melihat data tetapi tidak mendapat aksi tambah/ubah pasien | ⬜ |

---

## 5. Uji antrean

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| QUE-01 | Ambil nomor normal | Pilih pasien, poli UM, tanpa prioritas | Pratinjau tiket benar; nomor berikutnya diterbitkan; tiket muncul di papan | ✅ |
| QUE-02 | Prioritas | Ambil nomor dengan prioritas dan catatan | Tiket ditandai prioritas; catatan tersimpan; estimasi prioritas tampil | ✅ |
| QUE-03 | Panggil berikutnya | Dari antrean, tekan panggil berikutnya | Pasien prioritas dipilih lebih dahulu, lalu urutan waktu | ✅ |
| QUE-04 | Detail tiket | Buka tiket menunggu, panggil, lalu batalkan | Status berubah; pembatalan meminta konfirmasi; aksi sesuai status | ⬜ |
| QUE-05 | Display | Buka `/antrean/display` | Nomor yang dipanggil tampil besar; daftar menunggu terbaca | ⬜ |
| QUE-06 | Filter kosong | Pilih filter status yang tidak memiliki tiket | Empty state dan tombol “Tampilkan semua” bekerja | ⬜ |
| QUE-07 | Cakupan dokter | Login `doktergigi`, buka antrean | Hanya tiket GG yang tampil untuk dokter; tiket poli lain tidak membocorkan aksi | ⬜ |

---

## 6. Uji EMR

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| EMR-01 | Worklist dokter | Login `dokter`, buka `/periksa` | Tiket UM aktif dan EMR selesai milik dokter tampil; tiket poli lain tidak ada | ⬜ |
| EMR-02 | Batas poli | Login `doktergigi`, buka `/periksa/tkt-um-001` | Pesan “Antrean berada di poli lain”; tidak dapat mengisi EMR | ⬜ |
| EMR-03 | Validasi langkah | Coba lanjut dengan keluhan kosong dan tanda vital di luar rentang | Langkah tertahan; pesan validasi spesifik muncul | ⬜ |
| EMR-04 | Isi EMR lengkap | Isi keluhan, vital valid, diagnosis, tindakan, catatan | Langkah dapat dilalui; ringkasan dan status kesiapan benar | ✅ |
| EMR-05 | Resep | Tambah obat, ubah jumlah, coba melebihi stok, hapus baris | Hanya stok tersedia yang dapat dipilih; jumlah dibatasi; baris dapat dihapus | ⬜ |
| EMR-06 | Simpan EMR | Simpan EMR tiket baru | Tiket menjadi selesai; tagihan dibuat; sheet ringkasan tampil | ✅ |
| EMR-07 | Kunci tagihan lunas | Bayar tagihan `rec-001`, lalu buka EMR terkait | Semua input terkunci; banner menjelaskan tagihan sudah lunas | ⬜ |
| EMR-08 | Kunci resep | Serahkan resep `rec-001` sebelum dibayar, lalu buka EMR | Bagian resep terkunci; catatan klinis masih dapat diedit | ⬜ |
| EMR-09 | Share ringkasan | Dari sheet EMR selesai, tekan bagikan | Share sheet native terbuka dengan ringkasan; close tanpa crash | 🟡 |

---

## 7. Uji farmasi

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| PHA-01 | Buku stok | Buka `/farmasi`, cari obat, filter Menipis/Kedaluwarsa | Data, hitungan, dan badge sesuai; item kedaluwarsa merah | ⬜ |
| PHA-02 | Stok masuk | Pilih obat, Stok masuk 10, simpan | Stok bertambah 10; preview benar; sheet tertutup | ⬜ |
| PHA-03 | Stok keluar berlebih | Pilih stok 9, keluarkan 10 | Simpan dinonaktifkan; pesan stok tidak cukup; stok tidak berubah | ⬜ |
| PHA-04 | Resep menunggu | Buka `/farmasi/resep` | `rec-001` tampil; kebutuhan obat, stok, dan kedaluwarsa benar | ⬜ |
| PHA-05 | Serah terima sukses | Buka sheet serah terima, tekan Serahkan obat | Stok berkurang; resep pindah ke riwayat; metrik berubah | ✅ |
| PHA-06 | Serah terima terblokir | Turunkan stok di bawah kebutuhan resep, lalu coba serah terima | Tombol/serah terima ditolak; pesan menyebut obat dan stok | ⬜ |
| PHA-07 | Resep sudah diserahkan | Buka ulang `rec-002` | Tidak ada aksi serah terima; status sudah diserahkan | ⬜ |

---

## 8. Uji kasir dan pembayaran

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| PAY-01 | Daftar tagihan | Buka `/kasir` | Dua tagihan terbuka tampil; total, pasien, dan nomor benar | ⬜ |
| PAY-02 | Rincian akordeon | Buka satu tagihan | Rincian biaya dan total cocok; hanya satu panel terbuka | ⬜ |
| PAY-03 | Tunai tidak cukup | Pilih Tunai, isi nominal < total | Tombol bayar nonaktif; tidak ada pembayaran tercatat | ⬜ |
| PAY-04 | Tunai cukup | Isi nominal ≥ total, konfirmasi | Tagihan lunas; kuitansi tampil; kembalian benar | ⬜ |
| PAY-05 | BPJS/Transfer | Bayar tagihan pasien BPJS dengan BPJS; bayar tagihan Umum dengan Transfer | Metode tersimpan; kuitansi menunjukkan metode yang benar | ✅ |
| PAY-06 | Riwayat | Buka `/kasir/riwayat`, cari transaksi, buka kuitansi | Transaksi dikelompokkan per tanggal; kuitansi dapat dibuka ulang | ⬜ |
| PAY-07 | Share kuitansi | Dari kuitansi, tekan bagikan | Share sheet native terbuka; tidak crash saat ditutup | 🟡 |
| PAY-08 | Tagihan hilang dari aktif | Setelah pembayaran, kembali ke `/kasir` | Tagihan lunas tidak lagi muncul di daftar aktif | ⬜ |

---

## 9. Uji laporan

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| REP-01 | Filter periode | Pilih Hari ini, 7 hari, 30 hari | Label periode dan seluruh metrik berubah konsisten | ⬜ |
| REP-02 | Agregat | Bandingkan kunjungan, EMR, pendapatan, stok kritis | Angka sesuai data dan hanya menghitung tagihan lunas untuk pendapatan | ⬜ |
| REP-03 | Diagnosis dan obat | Periksa daftar diagnosis, metode bayar, dan obat | Urutan dan total masuk akal; empty state tersedia | ⬜ |
| REP-04 | Ekspor | Tekan bagikan laporan | Share sheet berisi ringkasan periode, kunjungan, pendapatan, dan catatan stok | 🟡 |
| REP-05 | Akses non-admin | Login `dokter` atau `kasir`, buka `/laporan` | Access Denied; tidak ada data manajemen terbuka | ⬜ |

---

## 10. Uji manajemen pengguna

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| USR-01 | Daftar pengguna | Buka `/pengguna`, cari dan filter peran | Hasil benar; hitungan aktif/nonaktif sesuai | ⬜ |
| USR-02 | Lindungi akun sendiri | Coba toggle status akun admin yang sedang login | Switch dinonaktifkan; catatan “Akun Anda tidak dapat dinonaktifkan” | ⬜ |
| USR-03 | Nonaktifkan pengguna | Nonaktifkan `dimas`, lalu coba login | Status berubah; login ditolak | ⬜ |
| USR-04 | Reset kata sandi | Reset sandi staf, baca dialog | Dialog menampilkan `sehat123`; login dengan sandi baru berhasil | ⬜ |
| USR-05 | Tambah akun valid | Isi form akun dokter dengan poli, simpan | Akun dibuat; sheet kredensial tampil; akun dapat login | ⬜ |
| USR-06 | Validasi akun | Nama pengguna duplikat, password < 6, konfirmasi beda, dokter tanpa poli | Form menolak dengan pesan spesifik | ⬜ |

---

## 11. Uji lintas modul, visual, dan sistem

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| SYS-01 | Alur ujung ke ujung | Registrasi → antrean → EMR → farmasi → kasir → laporan | Data dan status konsisten pada setiap perpindahan peran | ⬜ |
| SYS-02 | Empty states | Cari data yang tidak ada di pasien, antrean, farmasi, kasir, pengguna | Empty state jelas dan tindakan pemulihan tersedia | ⬜ |
| SYS-03 | Blokir double action | Tekan simpan/bayar dua kali cepat | Tidak ada record/tagihan/pembayaran ganda | ⬜ |
| SYS-04 | 404 | Buka route yang tidak dikenal | Halaman 404 bermerek dan tombol kembali ke beranda | ✅ |
| SYS-05 | Reload data | Ubah data, muat ulang | Data klinik kembali ke seed; sesi tetap (sesuai desain demo) | ⬜ |
| SYS-06 | Keyboard dan scroll | Buka form panjang, fokus field bawah, buka keyboard | Field tidak tertutup; halaman tetap dapat digulir | 🟡 |
| SYS-07 | Layar kecil | Uji lebar 360 px | Tidak ada teks/aksi terpotong; dock dan footer tidak bertumpuk | ⬜ |
| SYS-08 | Tablet/web | Uji lebar 768–1024 px | Konten tetap terpusat maksimal 760 px; form tidak melebar berlebihan | 🟡 |
| SYS-09 | Kontras dan label | Periksa tag, tombol, form, status | Label teks ada; status tidak hanya warna; kontras kritis sesuai design system | 🟡 |
| SYS-10 | Console bersih | Buka DevTools console selama alur utama | Tidak ada uncaught error atau warning React kritis | ✅ |
| SYS-11 | Kinerja dasar | Buka beranda dan daftar 14 obat | Layar tampil tanpa jeda yang mengganggu; tidak ada render loop | ⬜ |

---

## 12. Matriks perangkat

| Platform | Versi | Status | Catatan |
| --- | --- | --- | --- |
| Android Expo Go | SDK 58 | ⬜ Belum diuji | Perlu perangkat fisik/emulator |
| iOS Expo Go | SDK 58 | ⬜ Belum diuji | Perlu perangkat Apple |
| Web Chromium | Desktop | ⬜ Akan diuji | Target build; share sheet berbeda |
| Web Firefox | Desktop | ➖ | Tidak menjadi target utama |

### Kasus yang wajib diuji native

- Share kuitansi, ringkasan EMR, kartu pasien, dan laporan.
- Safe area atas/bawah pada perangkat dengan notch.
- Keyboard dan form panjang (login, pasien, EMR, tambah pengguna).
- Bottom sheet saat keyboard terbuka.
- Status bar terang/gelap pada hero.
- Performa scroll daftar dan grafik.

---

## 13. Defect log

| ID | Tanggal | Modul | Deskripsi | Severity | Status |
| --- | --- | --- | --- | --- | --- |
| — | — | — | Belum ada defect yang dicatat pada verifikasi ini | — | — |

Severity:

- **Blocker:** alur utama tidak dapat diselesaikan atau data rusak.
- **Mayor:** hasil salah, akses tidak sesuai, atau kehilangan data.
- **Minor:** masalah kosmetik, copy, atau konsistensi.
- **Trivial:** saran penyempurnaan.

---

## 14. Exit criteria rilis demo

Demo dinyatakan siap jika:

- [x] TypeScript tanpa error.
- [x] ESLint tanpa error/warning.
- [x] Export web berhasil.
- [x] Semua route utama dapat dibundel.
- [ ] Semua kasus AUTH dan RBAC lolos di minimal satu platform interaktif.
- [ ] Alur ujung ke ujung SYS-01 lolos.
- [ ] Tidak ada defect Blocker/Mayor terbuka.
- [ ] Share sheet diverifikasi pada perangkat native atau diberi catatan batasan.
- [ ] Uji perangkat fisik Android/iOS dicatat.

> Uji otomatis membuktikan kompilasi dan integritas tipe, bukan perilaku runtime
> di perangkat. Status final harus mengikuti hasil uji manual yang dicatat.
