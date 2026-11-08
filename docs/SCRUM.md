# Praktik Scrum — Puskesmas Mobile

**Produk:** Puskesmas Mobile  
**Jenis dokumen:** catatan praktik Scrum dan rencana rilis demo  
**Kadensi sprint:** 2 minggu  
**Jumlah sprint:** 5 sprint (Sprint 0–4), total 10 minggu  
**Pemilik produk:** Product Owner layanan puskesmas  
**Status:** demo selesai, siap dipresentasikan

> Dokumen ini merekam cara kerja Scrum yang dipakai untuk membangun demo
> Puskesmas Mobile. Angka story point, velocity, dan catatan retrospektif
> merupakan rekonstruksi rencana kerja demo, bukan ekspor dari Jira, Linear,
> atau alat manajemen lain. Tujuannya agar keputusan produk dan kualitas dapat
> diaudit, bukan untuk mengklaim produktivitas tim nyata.

---

## 1. Ringkasan produk

### Masalah

Petugas puskesmas berpindah-pindah antara buku pendaftaran, kertas rekam
medis, catatan stok, dan kalkulator pembayaran. Perpindahan ini membuat status
pasien tidak konsisten, antrean sulit dipantau, resep tidak selalu cocok dengan
stok, dan laporan baru dapat disusun setelah layanan selesai.

### Visi produk

> Dalam satu alur mobile, petugas puskesmas dapat membawa pasien dari
> pendaftaran hingga pembayaran dengan status yang jelas, data yang konsisten,
> dan pekerjaan yang sesuai peran.

### Tujuan produk

1. Menyatukan pendaftaran, antrean, EMR, farmasi, kasir, dan laporan dalam satu
   aplikasi.
2. Mencegah kesalahan operasional yang umum: nomor ganda, stok negatif, obat
   kedaluwarsa, tagihan ganda, dan EMR berubah setelah dibayar.
3. Memberi setiap peran layar awal dan navigasi yang relevan tanpa harus
   memahami seluruh sistem.
4. Menghasilkan pengalaman demo yang dapat dijalankan di Expo Go dan web tanpa
   backend.
5. Menyediakan fondasi kode dan dokumentasi yang dapat dikembangkan ke sistem
   nyata.

### Ukuran keberhasilan demo

| Tujuan | Kriteria terukur | Hasil |
| --- | --- | --- |
| Cakupan peran | 6 peran dapat login dan hanya melihat modul yang berhak | Tercapai |
| Alur ujung ke ujung | Satu pasien dapat melewati pendaftaran → antrean → EMR → farmasi → kasir | Tercapai |
| Konsistensi status | EMR menutup antrean dan membuat/memperbarui tagihan | Tercapai |
| Penguncian | EMR terkunci setelah lunas; resep terkunci setelah serah terima | Tercapai |
| Kualitas otomatis | TypeScript, ESLint, dan export web bersih | Tercapai |
| Kesiapan demo | Skenario 5 menit dengan akun demo terdokumentasi | Tercapai |

### Di luar cakupan MVP

- Backend, basis data produksi, dan sinkronisasi multiperangkat.
- Integrasi resmi BPJS/SIMPUS dan verifikasi eligibilitas.
- Manajemen batch, nomor lot, dan peringatan kedaluwarsa otomatis.
- Notifikasi push, antrean online pasien, dan portal pasien.
- Tanda tangan elektronik, audit trail, dan retensi rekam medis sesuai regulasi.
- Pembayaran daring dan rekonsiliasi bank.

---

## 2. Peran tim dan pemangku kepentingan

| Peran Scrum | Tanggung jawab dalam proyek |
| --- | --- |
| Product Owner | Menjaga visi, memprioritaskan backlog, menerima hasil sprint, dan mewakili kebutuhan layanan puskesmas |
| Scrum Master | Menjaga proses, memfasilitasi upacara, menghilangkan hambatan, dan menjaga fokus sprint |
| Development Team | Desain antarmuka, implementasi fitur, penulisan dokumentasi, dan verifikasi teknis |
| Clinical Reviewer | Meninjau istilah klinis, urutan EMR, dan kelayakan alur demo |
| Stakeholder demo | Perwakilan petugas pendaftaran, dokter/perawat, farmasi, kasir, dan manajemen |

Dalam latihan demo ini, beberapa peran dapat dirangkap oleh orang yang sama.
Pemisahan peran tetap penting agar keputusan produk tidak otomatis menjadi
keputusan teknis, dan agar hasil sprint tetap ditinjau dari sudut pandang
pengguna.

### Working agreement

- Satu sprint memiliki satu **sprint goal**; permintaan di luar goal masuk
  product backlog, bukan langsung ke sprint.
- Setiap perubahan perilaku wajib memiliki kriteria penerimaan dan skenario QA.
- `main` harus selalu lolos typecheck dan lint sebelum demo.
- Salinan antarmuka menggunakan bahasa Indonesia, angka mengikuti format lokal,
  dan istilah klinis ditinjau oleh clinical reviewer.
- Keputusan yang mengubah aturan bisnis dicatat di decision log.
- Demo memakai data mock; tidak ada data pasien nyata yang boleh dimasukkan.

---

## 3. Pengguna dan kebutuhan

| Persona | Kebutuhan utama | Risiko jika gagal |
| --- | --- | --- |
| Administrator | Melihat seluruh layanan, laporan, dan mengelola akses staf | Kehilangan kendali atas akun dan kinerja layanan |
| Petugas Pendaftaran | Mendaftarkan pasien cepat, mencari data, menerbitkan nomor | Antrean ganda, data pasien salah, pasien menunggu lama |
| Dokter | Fokus pada poli sendiri, mengisi EMR, meresepkan obat | Rekam medis tidak lengkap atau terubah setelah pembayaran |
| Perawat | Melihat antrean dan membantu pengisian EMR | Status pasien tidak sinkron dengan ruang periksa |
| Petugas Farmasi | Meninjau resep, mengecek stok/kedaluwarsa, menyerahkan obat | Obat salah, stok negatif, obat kedaluwarsa diberikan |
| Petugas Kasir | Menagih sesuai rincian, menerima metode bayar, mencetak kuitansi | Tagihan ganda, nominal salah, riwayat tidak dapat ditelusuri |

### Prinsip priorisasi

Prioritas memakai **MoSCoW**:

- **Must have:** alur inti, RBAC, validasi keselamatan, dan penguncian.
- **Should have:** kuitansi yang dapat dibagikan, laporan, branding.
- **Could have:** penyempurnaan visual dan konten bantuan.
- **Won't have (MVP):** integrasi eksternal, backend, notifikasi.

---

## 4. Artefak Scrum

### Product Backlog

Product backlog adalah sumber tunggal permintaan produk. Setiap item memiliki
kriteria penerimaan, estimasi, dan status. Item “Done” telah melewati
Definition of Done pada bagian 8.

| ID | Epik | User story ringkas | MoSCoW | SP | Sprint | Status |
| --- | --- | --- | --- | ---: | --- | --- |
| FND-01 | Fondasi | Petakan alur layanan, peran, dan aturan bisnis sebelum menulis UI | Must | 5 | 0 | Done |
| FND-02 | Fondasi | Siapkan Expo SDK 58, struktur fitur, dan quality gate dasar | Must | 5 | 0 | Done |
| DS-01 | Fondasi | Bangun token Warm Teal dan pustaka komponen bersama | Must | 8 | 0 | Done |
| ACC-01 | Akses | Sebagai staf, saya dapat masuk, keluar, dan sesi saya diingat | Must | 8 | 1 | Done |
| ACC-02 | Akses | Sebagai pengguna, saya hanya melihat menu dan route sesuai peran | Must | 5 | 1 | Done |
| PAT-01 | Pasien | Sebagai petugas, saya dapat mencari pasien dan melihat profilnya | Must | 5 | 1 | Done |
| PAT-02 | Pasien | Sebagai petugas, saya dapat menambah/mengubah pasien dengan validasi | Must | 8 | 1 | Done |
| QUE-01 | Antrean | Sebagai petugas, saya dapat menerbitkan nomor per poli dengan prioritas | Must | 8 | 1 | Done |
| QUE-02 | Antrean | Sebagai petugas, saya dapat memanggil antrean dan melihat display ruang | Must | 5 | 1 | Done |
| EMR-01 | Klinis | Sebagai dokter, saya melihat worklist poli sendiri dan EMR selesai | Must | 5 | 2 | Done |
| EMR-02 | Klinis | Sebagai tenaga medis, saya mengisi EMR empat langkah dengan validasi | Must | 13 | 2 | Done |
| EMR-03 | Klinis | Sebagai dokter, saya meresepkan obat dengan batas stok dan kedaluwarsa | Must | 5 | 2 | Done |
| EMR-04 | Klinis | Menyimpan EMR menutup tiket dan menyinkronkan tagihan; tagihan lunas mengunci EMR | Must | 8 | 2 | Done |
| PHA-01 | Farmasi | Sebagai apoteker, saya melihat buku stok, peringatan, dan menyesuaikan stok | Must | 8 | 2 | Done |
| PHA-02 | Farmasi | Sebagai apoteker, saya memvalidasi lalu menyerahkan resep dan mengurangi stok | Must | 8 | 3 | Done |
| PAY-01 | Kasir | Sebagai kasir, saya membuka tagihan, memeriksa rincian, dan menerima pembayaran | Must | 8 | 3 | Done |
| PAY-02 | Kasir | Sebagai kasir, saya membagikan kuitansi dan menelusuri riwayat pembayaran | Should | 5 | 3 | Done |
| REP-01 | Laporan | Sebagai admin, saya melihat agregat periode dan membagikan laporan | Should | 8 | 3 | Done |
| USR-01 | Pengguna | Sebagai admin, saya mengelola akun, status aktif, kata sandi, dan peran | Must | 10 | 3 | Done |
| BRD-01 | Rilis | Terapkan identitas visual pada ikon, splash, favicon, dan konfigurasi aplikasi | Should | 5 | 4 | Done |
| QLT-01 | Rilis | Uji semua peran, state kosong, validasi, dan kontras teks | Must | 8 | 4 | Done |
| DOC-01 | Rilis | Tulis README, praktik Scrum, design system, dan checklist QA | Should | 5 | 4 | Done |
| REL-01 | Rilis | Jalankan typecheck, lint, export web, dan expo-doctor | Must | 3 | 4 | Done |
| DEMO-01 | Rilis | Susun skenario demo 5 menit dan akun contoh | Must | 4 | 4 | Done |

**Total story point MVP:** 160 SP.

### Kriteria penerimaan utama

| ID | Kriteria penerimaan yang disepakati |
| --- | --- |
| ACC-01 | Kredensial benar membuka beranda; kredensial salah menampilkan pesan; akun nonaktif ditolak; sesi bertahan setelah reload; logout menghapus sesi |
| ACC-02 | Dock, katalog menu, dan akses route mengikuti peran; route terlarang menampilkan Access Denied; administrator melewati semua batas modul |
| PAT-01 | Pencarian nama/NIK/RM bekerja; filter BPJS/Umum menghitung benar; empty state memberi tindakan lanjut |
| PAT-02 | NIK, tanggal lahir, telepon, dan fields wajib divalidasi; nomor RM dibuat otomatis; mode ubah mempertahankan ID dan nomor RM |
| QUE-01 | Nomor per poli berurutan; prioritas meminta catatan; estimasi menyesuaikan antrean; tiket dapat dipratinjau |
| QUE-02 | Antrean menunggu/dipanggil diurutkan sesuai prioritas; panggil berikutnya memilih pasien tepat; display menampilkan panggilan aktif |
| EMR-01 | Dokter hanya melihat tiket poli sendiri; EMR selesai tetap dapat dibuka oleh penulisnya; perawat melihat antrean yang diizinkan |
| EMR-02 | Empat langkah dapat dilalui; validasi mencegah simpan tidak lengkap; rentang tanda vital diperiksa; state terkunci menonaktifkan input |
| EMR-03 | Hanya obat dengan stok tersedia yang dapat ditambahkan; jumlah tidak melebihi stok; obat kedaluwarsa ditandai; baris dapat dihapus |
| EMR-04 | Simpan menutup tiket, membuat tagihan baru atau memperbarui tagihan terbuka; tagihan lunas mengunci EMR; ringkasan dapat dibagikan |
| PHA-01 | Stok dapat dicari/difilter; stok rendah dan kedaluwarsa ditandai; penyesuaian tidak menghasilkan stok negatif |
| PHA-02 | Resep kosong, stok kurang, dan obat kedaluwarsa ditolak dengan pesan jelas; serah terima sukses mengurangi stok dan mengunci resep |
| PAY-01 | Hanya tagihan terbuka yang muncul; rincian akordeon benar; Tunai membutuhkan nominal cukup; metode tersimpan; tagihan lunas hilang dari daftar aktif |
| PAY-02 | Kuitansi memuat nomor, pasien, rincian, metode, dan waktu; share sheet dapat dibuka; riwayat dikelompokkan per tanggal |
| REP-01 | Filter 1/7/30 hari mengubah angka; total pendapatan hanya dari tagihan lunas; ekspor memuat ringkasan periode |
| USR-01 | Akun baru tervalidasi dan unik; admin tidak dapat menonaktifkan diri sendiri; toggle aktif bekerja; reset menghasilkan `sehat123`; kredensial baru ditampilkan sekali |
| BRD-01 | Ikon, adaptive icon, splash, monochrome, dan favicon bermerek; konfigurasi aplikasi memakai warna kanvas krem; tidak ada aset template tertinggal |
| QLT-01 | Matriks QA per peran dijalankan; tidak ada defect kritis terbuka; state kosong dan error dapat dipulihkan |
| DOC-01 | README berbahasa Indonesia memuat setup Expo Go, akun demo, dan batasan; dokumen Scrum dan design system lengkap |
| REL-01 | `npx tsc --noEmit`, `npx expo lint`, dan `npx expo export --platform web` lolos |
| DEMO-01 | Enam akun aktif dapat login; skenario demo dapat diikuti tanpa data awal tambahan |

---

## 5. Rencana sprint dua minggu

Setiap sprint berdurasi **10 hari kerja** dan diakhiri demo serta retrospektif.
Sprint 0 tetap memakai timebox dua minggu; ia bukan fase “pre-Scrum” tanpa
batas.

| Sprint | Minggu | Sprint goal | Scope utama | Hasil increment |
| --- | --- | --- | --- | --- |
| 0 | 1–2 | Fondasi yang dapat diverifikasi | FND-01, FND-02, DS-01 | Struktur Expo, token Warm Teal, komponen dasar, quality gate awal |
| 1 | 3–4 | Petugas dapat masuk dan mengelola kunjungan | ACC-01, ACC-02, PAT-01, PAT-02, QUE-01, QUE-02 | Login/RBAC, direktori & form pasien, penerbitan dan panggilan antrean |
| 2 | 5–6 | Dokter menyelesaikan EMR dan apoteker mengelola stok | EMR-01–04, PHA-01 | Worklist, EMR empat langkah, resep, sinkronisasi tagihan, buku stok |
| 3 | 7–8 | Obat diserahkan, tagihan dibayar, manajemen mendapat laporan | PHA-02, PAY-01, PAY-02, REP-01, USR-01 | Serah terima tervalidasi, kasir, kuitansi, riwayat, laporan, pengguna |
| 4 | 9–10 | Demo siap dipresentasikan dengan kualitas terukur | BRD-01, QLT-01, DOC-01, REL-01, DEMO-01 | Branding, QA, dokumentasi, build bersih, skenario demo |

### Sprint 0 — Fondasi yang dapat diverifikasi

**Sprint goal:** menyepakati alur dan sistem visual sebelum fitur bertambah.

- Memetakan 6 peran, 5 poli, dan transisi status tiket.
- Menetapkan pemisahan route tipis, komponen bersama, core, dan fitur.
- Menyusun token warna, tipografi, jarak, radius, dan bayangan.
- Membangun AppPage, TopBar, dock, tombol, field, tag, surface, sheet, dan
  ticket card.
- Menyiapkan typecheck dan lint sebagai gerbang awal.

**Demo:** galeri komponen dan navigasi kosong dengan dua tema peran berbeda.
**Keputusan penting:** layout tidak boleh menyalin aplikasi referensi; hanya
alur fungsional yang boleh dijadikan acuan.

### Sprint 1 — Petugas dapat masuk dan mengelola kunjungan

**Sprint goal:** staf dapat login, menemukan pasien, mendaftarkannya, dan
menerbitkan nomor antrean.

- Sesi login dengan AsyncStorage dan validasi akun aktif.
- Role dock, katalog modul, dan route guard.
- Direktori pasien, pencarian, filter jaminan, dan profil pasien.
- Form pasien tiga langkah dengan validasi.
- Penerbitan nomor per poli, prioritas, dan estimasi.
- Papan antrean, panggil berikutnya, perubahan status, display.

**Demo:** petugas pendaftaran mendaftarkan pasien baru dan menerbitkan tiket.
**Risiko yang muncul:** tiket prioritas bisa terlihat “menyalip” tanpa
penjelasan; diselesaikan dengan catatan prioritas dan badge coral.

### Sprint 2 — EMR dan fondasi farmasi

**Sprint goal:** dokter dapat menyelesaikan pemeriksaan dan menyimpan resep,
sementara apoteker dapat melihat serta menyesuaikan stok.

- Worklist dokter berbasis poli dan riwayat EMR.
- EMR empat langkah: keluhan, tanda vital, diagnosis, resep.
- Validasi rentang vital dan fields wajib.
- Pemilih obat dengan stok, harga, kedaluwarsa, dan batas jumlah.
- Simpan EMR menutup tiket dan menyinkronkan tagihan.
- Buku stok dengan filter, peringatan, dan penyesuaian.

**Demo:** dokter menyelesaikan EMR pasien, apoteker melihat resep dan stok.
**Keputusan penting:** EMR yang tagihannya sudah lunas menjadi read-only;
resep yang sudah diserahkan juga read-only.

### Sprint 3 — Operasional harian dan manajemen

**Sprint goal:** layanan dapat ditutup secara operasional, dari serah terima obat
hingga pembayaran dan laporan.

- Serah terima resep dengan validasi stok dan kedaluwarsa.
- Tagihan aktif dengan akordeon rincian dan bottom sheet pembayaran.
- Metode Tunai, BPJS, dan Transfer; validasi nominal tunai.
- Kuitansi bersama dengan aksi berbagi.
- Riwayat pembayaran per tanggal.
- Laporan periode, diagnosis, metode bayar, obat, dan stok.
- Manajemen pengguna dan penambahan akun.

**Demo:** apoteker menyerahkan obat, kasir menerima pembayaran, admin membuka
laporan dan menambah akun.
**Risiko yang muncul:** ekspor laporan melalui share sheet perlu diuji di
perangkat; web hanya menjadi target build, bukan target utama share.

### Sprint 4 — Kesiapan rilis demo

**Sprint goal:** semua alur dapat didemokan dengan identitas visual dan kualitas
yang konsisten.

- Membuat ikon, adaptive icon, splash, monochrome, dan favicon.
- Memperbarui konfigurasi aplikasi dan membersihkan aset template.
- Menyusun QA checklist per peran dan kasus negatif.
- Menulis README, dokumen Scrum, design system, dan panduan Expo Go.
- Menjalankan typecheck, lint, export web, dan expo-doctor.
- Melakukan gladi demo 5 menit.

**Demo:** gladi bersih dengan akun demo dan skenario utama.
**Kriteria rilis:** tidak ada error/warning lint, error TypeScript, atau defect
kritis terbuka.

---

## 6. Upacara Scrum

| Upacara | Waktu | Timebox | Peserta | Keluaran |
| --- | --- | --- | --- | --- |
| Backlog refinement | Setiap Rabu minggu pertama | 60 menit | PO, developer, QA | Item siap dengan kriteria penerimaan dan estimasi |
| Sprint Planning | Hari 1 sprint | 90–120 menit | Seluruh tim | Sprint goal, sprint backlog, kapasitas |
| Daily Scrum | Setiap hari kerja | 15 menit | Development team | Hambatan dan sinkronisasi hari itu |
| PO sync | Setiap Selasa | 30 menit | PO dan Scrum Master | Prioritas, risiko, keputusan produk |
| Sprint Review | Hari 9 (Kamis) | 60 menit | Tim dan stakeholder | Demo increment dan umpan balik |
| Sprint Retrospective | Hari 10 (Jumat) | 45 menit | Tim | Satu–dua aksi perbaikan dengan pemilik |
| Backlog review | Setelah review | 30 menit | PO dan tim | Item baru/diubah masuk backlog |

### Aturan upacara

- Daily membahas hambatan, bukan laporan status panjang.
- Review menampilkan increment yang berjalan, bukan slide rencana.
- Retrospektif memakai format **Keep / Problem / Try** dan menghasilkan aksi
  konkret yang dapat dilakukan pada sprint berikutnya.
- Item yang tidak selesai tidak disembunyikan; item kembali ke backlog atau
  dipindahkan ke sprint berikutnya dengan alasan.
- Perubahan scope di tengah sprint hanya diterima jika sprint goal terancam
  atau ada risiko keselamatan/regulasi.

---

## 7. Estimasi dan velocity

### Teknik estimasi

- Planning poker dengan skala Fibonacci: 1, 2, 3, 5, 8, 13.
- Item di atas 13 SP harus dipecah.
- Story point mengukur ukuran relatif (kompleksitas, ketidakpastian, dan
  verifikasi), bukan jam kerja.
- Acuan estimasi: form pasien tiga langkah (8 SP) dan EMR empat langkah (13 SP).

### Velocity

| Sprint | Komitmen (SP) | Selesai (SP) | Catatan |
| --- | ---: | ---: | --- |
| 0 | 18 | 18 | Fondasi selesai sebelum fitur |
| 1 | 39 | 39 | Login, pasien, antrean |
| 2 | 39 | 39 | EMR dan stok |
| 3 | 39 | 39 | Farmasi, kasir, laporan, pengguna |
| 4 | 25 | 25 | Branding, QA, dokumentasi, rilis |
| **Total** | **160** | **160** | Rata-rata 32 SP/sprint |

### Burndown Sprint 2

| Hari | Sisa ideal (SP) | Sisa aktual (SP) | Catatan |
| --- | ---: | ---: | --- |
| 0 | 39 | 39 | Sprint planning |
| 2 | 31 | 32 | Worklist EMR |
| 4 | 23 | 24 | Form dan validasi |
| 6 | 16 | 17 | Resep dan stok |
| 8 | 8 | 6 | Sinkronisasi tagihan |
| 10 | 0 | 0 | Review dan retrospektif |

Angka ini dipakai untuk memeriksa tren, bukan untuk menilai individu.

---

## 8. Definition of Ready dan Definition of Done

### Definition of Ready

Sebuah item boleh masuk sprint jika:

- memiliki nilai pengguna atau risiko yang jelas;
- memiliki kriteria penerimaan yang dapat diuji;
- sudah diestimasi dan cukup kecil untuk satu sprint;
- desain atau pola layar sudah disepakati;
- dependensi dan data mock sudah tersedia;
- kasus kosong, error, dan akses peran sudah dipikirkan.

### Definition of Done

Sebuah item dianggap selesai jika:

1. Kriteria penerimaan terpenuhi dan didemokan.
2. Akses peran serta navigasi keluar/masuk bekerja.
3. State kosong, validasi, dan pesan error tersedia dalam bahasa Indonesia.
4. Typecheck dan lint lolos tanpa error/warning baru.
5. Build web berhasil dan route baru terdaftar.
6. Perubahan aturan bisnis tercatat di dokumentasi.
7. QA checklist untuk alur terkait diperbarui.
8. Tidak ada data rahasia, `console.log` debug, atau aset template tertinggal.
9. Desain konsisten dengan token Warm Teal dan komponen bersama.

### Quality gate rilis

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web
npx expo-doctor
```

Gate ini dijalankan sebelum demo. Kegagalan pada typecheck, lint, atau export
memblokir label “siap demo”.

---

## 9. Sprint Review dan Retrospective

### Ringkasan review

| Sprint | Skenario yang didemokan | Umpan balik utama | Tindakan |
| --- | --- | --- | --- |
| 0 | Galeri komponen, dua dashboard peran | Hierarki teks kecil terlalu rapat di layar sempit | Naikkan ukuran minimum metadata dan uji pada lebar 360 px |
| 1 | Daftar pasien, form, ambil nomor, panggil antrean | Pengguna perlu tahu mengapa pasien prioritas didahulukan | Tambahkan badge, catatan prioritas, dan penjelasan estimasi |
| 2 | EMR empat langkah, resep, stok | Aturan penguncian tagihan belum terlihat jelas | Tambahkan banner status dan nonaktifkan input secara eksplisit |
| 3 | Serah terima obat, pembayaran, kuitansi, laporan | Kasir butuh rincian tagihan sebelum memilih metode | Akordeon rincian + bottom sheet dengan total dan validasi tunai |
| 4 | Gladi demo 5 menit | Reload menghapus data demo; peserta perlu diberi tahu | Cantumkan perilaku reset data di README dan brief demo |

### Catatan retrospektif

| Sprint | Keep | Problem | Try | Aksi dan pemilik |
| --- | --- | --- | --- | --- |
| 0 | Token-first dan komponen bersama | Review visual baru dilakukan di akhir | Review komponen setiap Jumat | QA visual per komponen — dev + QA |
| 1 | Route guard diuji per peran | Copy status antrean membingungkan | Uji alur dengan pembaca baru | Audit copy status — PO + dev |
| 2 | EMR dipecah menjadi tab | Aturan kunci ditemukan terlambat | Review aturan bisnis sebelum UI | Matriks kunci di QA checklist — PO |
| 3 | Validasi pembayaran per metode | Share sheet belum diuji di perangkat | Uji share lebih awal | Uji perangkat fisik — QA |
| 4 | Quality gate konsisten | Data demo mudah ter-reset | Jadikan reset bagian dari skrip demo | Brief demo + dokumentasi — PO |

Setiap retrospektif menghasilkan maksimal dua aksi. Aksi tanpa pemilik dianggap
belum disepakati.

---

## 10. Metrik dan kesehatan kualitas

| Metrik | Target | Hasil demo |
| --- | --- | --- |
| Error TypeScript terbuka | 0 | 0 |
| Error/warning ESLint terbuka | 0 | 0 |
| Route utama dapat dibundel untuk web | 100% | 100% |
| Defect kritis/mayor terbuka saat rilis | 0 | 0 |
| Peran dengan alur demo terverifikasi | 6/6 | 6/6 |
| Waktu demo inti | ≤ 5 menit | ± 5 menit |
| Item backlog MVP selesai | 100% | 100% |

### Interpretasi

- Kecepatan tinggi tidak dikorbankan untuk melewati validasi keselamatan.
- Jumlah story point tidak dibandingkan antaranggota tim.
- Temuan QA yang bersifat kosmetik dicatat, tetapi tidak memblokir demo jika
  tidak memengaruhi alur atau keselamatan.
- Metrik aksesibilitas perangkat fisik masih perlu diuji pada perangkat nyata;
  lihat risiko R-07.

---

## 11. Risiko dan mitigasi

| ID | Risiko | Dampak | Kemungkinan | Mitigasi | Status |
| --- | --- | --- | --- | --- | --- |
| R-01 | Data hilang saat reload karena state di memori | Sedang | Tinggi | Dokumentasikan reset; gunakan skenario demo berurutan | Diterima untuk demo |
| R-02 | Kredensial demo tidak aman | Tinggi | Tinggi | Tandai sebagai demo; jangan gunakan data nyata | Diterima untuk demo |
| R-03 | Stok tidak memakai batch/lot | Tinggi | Sedang | Validasi kedaluwarsa per item; dokumentasikan batasan | Terbuka untuk produksi |
| R-04 | BPJS disimulasikan sebagai metode bayar | Tinggi | Sedang | Jangan klaim integrasi; tambahkan langkah integrasi di README | Diterima untuk demo |
| R-05 | Share sheet berbeda di web/perangkat | Rendah | Sedang | Uji native; web hanya target build | Terbuka |
| R-06 | Scope creep modul baru | Sedang | Sedang | Sprint goal, MoSCoW, backlog refinement | Terkendali |
| R-07 | Screen reader dan dynamic type belum diuji menyeluruh | Sedang | Sedang | Label kontrol, kontras token, uji perangkat fisik | Terbuka |
| R-08 | Perbedaan ukuran layar kecil | Rendah | Sedang | Uji 360 px, max width, scroll, dock spacing | Terkendali |
| R-09 | Regulasi rekam medis tidak terpenuhi | Tinggi | Tinggi | Demo bukan sistem produksi; audit hukum sebelum adopsi | Terbuka |

---

## 12. Decision log

| ID | Keputusan | Alasan | Konsekuensi |
| --- | --- | --- | --- |
| D-01 | Expo managed workflow + Expo Router | Cepat, dapat dijalankan di Expo Go, route file-based | Tidak ada folder native; konfigurasi lewat app.json |
| D-02 | State klinik di memori, sesi di AsyncStorage | Demo tanpa backend, mudah di-reset | Data hilang saat reload; sesi tetap |
| D-03 | Arsitektur berbasis fitur | Route tipis, domain terisolasi, mudah dikembangkan | Perlu disiplin impor dan batas modul |
| D-04 | Warm Teal, bukan meniru aplikasi referensi | Identitas baru dan keterbacaan | Perlu pustaka komponen dan token sendiri |
| D-05 | EMR menyinkronkan tagihan | Mencegah tagihan ganda dan data yatim | Aturan kunci harus konsisten di UI dan selector |
| D-06 | Serah terima memvalidasi stok sebelum mengurangi | Keselamatan pasien dan integritas stok | Perlu penanganan kegagalan per baris |
| D-07 | Aset merek dibuat via skrip PowerShell | Tidak menambah dependensi gambar | Perubahan aset harus melalui skrip |
| D-08 | Semua salinan dalam bahasa Indonesia | Konteks pengguna puskesmas | Perlu format tanggal/Rupiah lokal |
| D-09 | Typecheck + lint + export web sebagai gate | Deteksi regresi cepat | Tidak menggantikan uji perangkat |
| D-10 | Tidak ada deliverable Figma | Fokus implementasi dan dokumentasi | Design system menjadi sumber kebenaran visual |

---

## 13. Traceability kebutuhan → implementasi

| Kebutuhan | Backlog | Implementasi utama | Verifikasi |
| --- | --- | --- | --- |
| Login, sesi, logout | ACC-01 | `src/features/auth/auth-provider.tsx`, `src/app/login.tsx`, `src/app/(main)/profil.tsx` | QA-AUTH |
| RBAC dan navigasi peran | ACC-02 | `src/core/navigation.ts`, route guard, `AccessDenied` | QA-RBAC |
| Pendaftaran pasien | PAT-02 | `src/app/(main)/pasien/daftar.tsx` | QA-PAT |
| Direktori dan riwayat pasien | PAT-01 | `src/app/(main)/pasien/index.tsx`, `pasien/[id].tsx` | QA-PAT |
| Antrean dan display | QUE-01, QUE-02 | `src/app/(main)/antrean/*` | QA-QUE |
| EMR dan resep | EMR-01–04 | `src/app/(main)/periksa/*` | QA-EMR |
| Stok dan serah terima | PHA-01, PHA-02 | `src/app/(main)/farmasi/*` | QA-PHA |
| Tagihan dan pembayaran | PAY-01, PAY-02 | `src/app/(main)/kasir/*`, `payment-receipt-sheet.tsx` | QA-PAY |
| Laporan | REP-01 | `src/app/(main)/laporan.tsx` | QA-REP |
| Manajemen pengguna | USR-01 | `src/app/(main)/pengguna/*` | QA-USR |
| Identitas visual | BRD-01 | `app.json`, `assets/images/*`, `scripts/generate-brand-assets.ps1` | QA-BRAND |
| Kualitas rilis | QLT-01, REL-01 | quality gate dan QA checklist | Semua |

---

## 14. Backlog setelah MVP

Item berikut sengaja **tidak** dikerjakan pada demo, tetapi sudah memiliki arah:

| ID | Item | Nilai | Prasyarat |
| --- | --- | --- | --- |
| FUT-01 | Backend dan autentikasi server | Keamanan dan multiperangkat | API, database, kebijakan sesi |
| FUT-02 | Integrasi SIMPUS/BPJS | Alur nyata dan eligibilitas | Kontrak integrasi dan kepatuhan |
| FUT-03 | Batch/lot obat dan resep elektronik | Keselamatan obat | Skema batch, audit stok |
| FUT-04 | Notifikasi antrean dan pengingat kontrol | Pengalaman pasien | Push notification/backend |
| FUT-05 | Audit trail dan e-signature | Kepatuhan rekam medis | Identitas petugas, kebijakan retensi |
| FUT-06 | Unit test dan E2E test | Regresi jangka panjang | Test runner dan device farm |
| FUT-07 | Audit aksesibilitas menyeluruh | Inklusi | Uji screen reader, dynamic type, contrast |
| FUT-08 | Portal pasien | Transparansi layanan | Autentikasi pasien dan backend |

---

## 15. Referensi internal

- [`README.md`](../README.md) — cara menjalankan, akun demo, dan batasan.
- [`docs/DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — fondasi visual dan komponen.
- [`docs/QA-CHECKLIST.md`](./QA-CHECKLIST.md) — skenario pengujian per peran.
- `src/core/navigation.ts` — sumber aturan peran dan navigasi.
- `src/features/clinic/clinic-provider.tsx` — aturan bisnis yang menjadi acuan
  implementasi.
