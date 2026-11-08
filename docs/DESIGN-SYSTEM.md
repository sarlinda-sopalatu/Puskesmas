# Design System — Warm Teal

**Produk:** Puskesmas Mobile  
**Nama sistem:** Warm Teal  
**Platform utama:** Android dan iOS melalui Expo Go  
**Target pendukung:** Web (React Native Web)  
**Status:** diterapkan pada seluruh layar demo  
**Sumber token:** `src/core/theme.ts`

> Warm Teal adalah sistem visual yang dibuat khusus untuk proyek ini. Sistem ini
> tidak menyalin layout, komponen, atau bahasa visual aplikasi Puskesmas
> sebelumnya. Aplikasi referensi hanya dipakai untuk memahami alur fungsi.

---

## 1. Tujuan dan prinsip

Warm Teal membawa dua gagasan sekaligus:

- **Warm** — layanan kesehatan tidak harus terasa dingin dan birokratis. Kanvas
  krem, tipografi tebal, dan aksen coral memberi kehangatan tanpa mengurangi
  ketenangan.
- **Teal** — warna teal menjadi penanda tindakan, status aktif, dan identitas
  utama. Navy dipakai untuk teks serta permukaan serius; coral hanya untuk
  urgensi.

### Prinsip desain

1. **Satu tugas utama per layar.** Tombol utama jelas; tindakan sekunder lebih
   tenang. Hindari dua tombol solid yang bersaing.
2. **Status harus terbaca tanpa warna saja.** Setiap status memakai teks, ikon,
   atau bentuk di samping warna.
3. **Mobile-first, bukan desktop yang diperkecil.** Konten mengalir vertikal,
   target sentuh cukup besar, dan dock berada dalam jangkauan ibu jari.
4. **Padat tetapi lapang.** Informasi operasional boleh padat; jarak dan
   hierarki tipografi menjaga agar tidak terasa sesak.
5. **Konsisten sebelum dekoratif.** Komponen bersama dan token dipakai lebih
   dahulu sebelum membuat variasi lokal.
6. **Bahasa manusia.** Pesan menjelaskan apa yang terjadi dan langkah
   berikutnya, bukan kode kesalahan.
7. **Aman secara visual.** Penguncian, peringatan stok, dan tindakan destruktif
   harus sulit terlewat.

---

## 2. Merek dan aset

### Brand mark

Brand mark berupa tile membulat dengan palang plus putih dan titik coral di
sudut kanan atas. Bentuk ini sederhana, mudah dikenali pada ukuran kecil, dan
tidak bergantung pada teks.

| Elemen | Aturan |
| --- | --- |
| Tile | Persegi membulat, radius 30% dari sisi |
| Palang | Lebar 50% dari tile, ketebalan 14,5%, sudut membulat |
| Titik aksen | Coral, radius sekitar 7,5% dari tile |
| Warna utama | Teal `#0F766E` dengan palang putih |
| Varian | Teal (default), ink, light untuk latar gelap |
| Ruang aman | Minimal 12,5% dari sisi tile di sekeliling mark |

Implementasi komponen: `src/components/ui/brand-mark.tsx`.

### Aset aplikasi

Aset dibuat oleh `scripts/generate-brand-assets.ps1` tanpa dependensi gambar
tambahan.

| Berkas | Ukuran | Penggunaan |
| --- | --- | --- |
| `assets/images/icon.png` | 1024×1024 | Ikon aplikasi utama |
| `assets/images/android-icon-foreground.png` | 1024×1024 | Foreground adaptive icon |
| `assets/images/android-icon-monochrome.png` | 1024×1024 | Ikon monokrom Android |
| `assets/images/splash-icon.png` | 1024×1024 | Splash screen, latar transparan |
| `assets/images/favicon.png` | 64×64 | Favicon web |

Konfigurasi Expo memakai latar kanvas `#F6F4EF`, splash dengan lebar gambar
180, dan adaptive icon dengan latar yang sama. Jalankan ulang skrip jika mark
atau warna merek berubah:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand-assets.ps1
```

### Wordmark

- Nama utama: **PUSKESMAS**
- Submark: **SISTEM LAYANAN TERPADU**
- Nama produk dalam dokumentasi: **Puskesmas Mobile**
- Wordmark memakai huruf kapital dengan tracking lebar; submark memakai ukuran
  lebih kecil dan warna yang lebih tenang.

---

## 3. Warna

### Palet inti

| Token | Hex | Peran |
| --- | --- | --- |
| `canvas` | `#F6F4EF` | Latar utama hangat |
| `canvasDeep` | `#EFEBE2` | Latar sekunder, keadaan nonaktif |
| `paper` | `#FFFFFF` | Permukaan kartu dan field |
| `paperWarm` | `#FFFDF8` | Permukaan input dan kartu hangat |
| `ink` | `#0B1F2A` | Teks utama, tombol gelap, latar hero |
| `inkSoft` | `#17323E` | Teks body |
| `inkMuted` | `#3D5560` | Label dan metadata penting |
| `teal` | `#0F766E` | Aksi utama, status aktif, brand |
| `tealDeep` | `#115E59` | Teks di atas tint teal |
| `tealSoft` | `#D9F3EE` | Latar status/tag teal |
| `tealTint` | `#F0FAF8` | Latar field fokus atau kartu ringan |
| `coral` | `#F97316` | Aksen urgensi dan dekorasi |
| `coralDeep` | `#C2410C` | Teks urgensi di atas coralSoft |
| `coralSoft` | `#FFEDD5` | Latar tag prioritas |
| `amber` | `#B45309` | Peringatan, stok rendah |
| `amberSoft` | `#FEF3C7` | Latar peringatan |
| `blue` | `#1D4ED8` | Informasi dan status dipanggil |
| `blueSoft` | `#DBEAFE` | Latar informasi |
| `violet` | `#6D28D9` | Farmasi, kategori khusus |
| `violetSoft` | `#EDE9FE` | Latar kategori farmasi |
| `rose` | `#BE123C` | Perawat, risiko sedang |
| `roseSoft` | `#FFE4E6` | Latar risiko sedang |
| `red` | `#B91C1C` | Error dan tindakan destruktif |
| `redSoft` | `#FEE2E2` | Latar error |
| `green` | `#047857` | Lunas, selesai, aman |
| `greenSoft` | `#D1FAE5` | Latar status aman |
| `muted` | `#5F5A50` | Teks sekunder dan placeholder |
| `mutedSoft` | `#756F63` | Metadata non-kritis dan ikon nonaktif |
| `line` | `#E4DED3` | Garis pemisah halus |
| `lineStrong` | `#CFC6B7` | Border kontrol |
| `overlay` | `rgba(11,31,42,0.56)` | Latar modal dan backdrop |

### Aturan pemakaian

- **Teal** untuk aksi positif/utama, bukan untuk semua tautan.
- **Coral** hanya untuk urgensi, prioritas, atau aksen kecil. Jangan memakai
  coral sebagai latar teks panjang.
- **CoralDeep** wajib untuk teks di atas `coralSoft`.
- **Merah** hanya untuk error atau tindakan destruktif, bukan untuk status
  “menunggu”.
- **Hijau** hanya untuk status selesai/lunas/aman.
- **Status tidak boleh dibedakan hanya lewat warna**; sertakan label teks.

### Kontras yang diverifikasi

Rasio dihitung terhadap latar yang tertera. Target teks normal adalah ≥ 4,5:1.

| Kombinasi | Rasio | Catatan |
| --- | ---: | --- |
| `ink` pada `canvas` | 15,36:1 | Teks utama |
| `white` pada `ink` | 16,89:1 | Hero dan tombol gelap |
| `white` pada `teal` | 5,47:1 | Tombol teal |
| `muted` pada `canvas` | 6,23:1 | Teks sekunder |
| `mutedSoft` pada `paper` | 4,99:1 | Metadata pada kartu |
| `tealDeep` pada `tealSoft` | 6,50:1 | Tag teal |
| `coralDeep` pada `coralSoft` | 4,52:1 | Tag prioritas |
| `amber` pada `amberSoft` | 4,51:1 | Tag peringatan |
| `blue` pada `blueSoft` | 5,49:1 | Tag informasi |
| `violet` pada `violetSoft` | 5,98:1 | Tag farmasi |
| `green` pada `greenSoft` | 4,84:1 | Tag aman |
| `red` pada `redSoft` | 5,30:1 | Tag error |

`mutedSoft` pada `canvasDeep` berada di bawah 4,5:1. Untuk teks normal di
permukaan tersebut, gunakan `muted` atau `inkMuted`. Teks 9–10 px dalam tag
memakai huruf kapital tebal dan hanya untuk label pendek; jangan memakai ukuran
ini untuk instruksi atau isi penting.

---

## 4. Tipografi

Aplikasi memakai font sistem perangkat (SF Pro pada iOS, Roboto pada Android,
font sistem pada web). Tidak ada unduhan font tambahan; ini menjaga waktu buka
dan konsistensi lintas platform. Bobot dan tracking diatur melalui token.

| Token | Ukuran / line-height | Bobot | Tracking | Pemakaian |
| --- | --- | --- | --- | --- |
| `display` | 34 / 39 | 800 | -1,1 | Angka atau judul hero besar |
| `h1` | 26 / 32 | 800 | -0,7 | Judul halaman |
| `h2` | 20 / 26 | 800 | -0,35 | Judul bagian |
| `h3` | 16 / 22 | 700 | 0 | Judul kartu |
| `body` | 14 / 21 | 400 | 0 | Isi utama |
| `bodyStrong` | 14 / 21 | 700 | 0 | Penekanan dalam isi |
| `small` | 12 / 17 | 400 | 0 | Keterangan |
| `tiny` | 10 / 14 | 400 | 0 | Metadata sangat kecil |
| `eyebrow` | 10 / 13 | 800 | 1,4 | Label bagian, uppercase |
| `number` | 40 / 44 | 800 | -1,5 | Angka metrik, tabular |

### Aturan tipografi

- Maksimal **dua tingkat penekanan** dalam satu blok: judul dan body, atau
  label dan nilai.
- Hindari teks kapital panjang; kapital hanya untuk eyebrow, tag, dan wordmark.
- Gunakan `fontVariant: ['tabular-nums']` untuk angka antrean, uang, tanggal
  tabel, dan metrik.
- Jangan memakai ukuran di bawah 10 px untuk konten yang harus dibaca.
- Teks penting tidak boleh bergantung pada warna saja; gunakan bobot, ikon,
  atau label.

---

## 5. Spacing, radius, dan bayangan

### Skala spacing

| Token | Nilai | Pemakaian umum |
| --- | ---: | --- |
| `xxs` | 2 | Jarak mikro |
| `xs` | 4 | Jarak ikon–teks kecil |
| `sm` | 8 | Jarak antarelmen rapat |
| `md` | 12 | Padding kartu kecil |
| `lg` | 16 | Padding kartu default |
| `xl` | 20 | Padding halaman, jarak bagian |
| `xxl` | 24 | Jarak antarbagian besar |
| `xxxl` | 32 | Jarak hero |
| `huge` | 40 | Jarak layar kosong |
| `giant` | 56 | Hero dan angka besar |

Gunakan kelipatan 4. Jarak 7, 9, 11, atau 13 boleh muncul untuk penyelarasan
komponen kecil, tetapi jangan menjadi default baru.

### Radius

| Token | Nilai | Pemakaian |
| --- | ---: | --- |
| `xs` | 6 | Tag |
| `sm` | 10 | Elemen kecil |
| `md` | 14 | Tombol dan input |
| `lg` | 20 | Kartu dan surface |
| `xl` | 26 | Sheet dan panel besar |
| `pill` | 999 | Choice pill dan avatar |

Kartu utama memakai `lg`; sheet memakai `xl + 4` pada sudut atas; brand mark
memakai 30% dari sisi.

### Bayangan

| Token | Pemakaian | Karakter |
| --- | --- | --- |
| `shadow.card` | Kartu elevated | Halus, rendah, untuk pemisahan |
| `shadow.dock` | Dock mengapung | Lebih dalam agar terpisah dari kanvas |
| `shadow.sheet` | Bottom sheet | Ke atas, tebal, menandakan lapisan |

Bayangan bersifat platform-aware: iOS memakai `shadow*`, Android memakai
`elevation`, web memakai `boxShadow`. Jangan menulis bayangan manual di layar.

---

## 6. Layout dan kerangka aplikasi

### AppPage

`src/components/layout/app-page.tsx` adalah kerangka utama:

- Safe area atas untuk header, bawah untuk dock/footer.
- Header mode: `plain`, `brand`, `back`, atau `none`.
- Konten scroll atau statis.
- `padded` default 20 px horizontal.
- `footer` untuk aksi lengket di atas keyboard/dock.
- `dock` menampilkan dock sesuai peran.
- Lebar konten dibatasi **760 px** di tengah; padding halaman **20 px**.
- Ruang bawah untuk dock: **124 px** agar item terakhir tidak tertutup.

### Navigasi

- Route berada di `src/app` dan hanya menyusun layar.
- Dock mengapung di bawah, bukan tab bar penuh.
- Setiap peran punya 4–5 entri dock yang relevan.
- Menu lengkap tersedia di `/menu`; profil dan logout di `/profil`.
- Header belakang dipakai untuk layar detail/form, bukan untuk layar utama.

### Grid dan kepadatan

- Dashboard memakai pasangan kartu metrik dua kolom dengan lebar minimum 86 px.
- Daftar memakai satu kolom penuh; hindari tabel horizontal pada layar sempit.
- Form memakai satu kolom; field berpasangan hanya jika label dan validasinya
  tetap jelas.
- Pada tablet/web, konten tetap di tengah dengan lebar maksimum; jangan
  meregangkan form hingga selebar layar.

---

## 7. Komponen

### Ringkasan inventaris

| Komponen | Berkas | Fungsi |
| --- | --- | --- |
| AppPage | `components/layout/app-page.tsx` | Kerangka layar, header, scroll, footer, dock |
| TopBar | `components/layout/top-bar.tsx` | Header plain/brand/back |
| PageHeading | `components/layout/page-heading.tsx` | Eyebrow, judul, deskripsi, aksi kanan |
| SectionHeading | `components/layout/section-heading.tsx` | Judul bagian dan aksi sekunder |
| BottomDock | `components/layout/bottom-dock.tsx` | Navigasi mengapung per peran |
| ActionButton | `components/ui/action-button.tsx` | Tombol utama dengan tone dan ukuran |
| TextField | `components/ui/text-field.tsx` | Input dengan label, hint, error, suffix |
| SearchField | `components/ui/search-field.tsx` | Pencarian dengan ikon dan pembersih |
| ChoicePills | `components/ui/choice-pills.tsx` | Filter pilihan tunggal |
| Tag | `components/ui/tag.tsx` | Status dan label pendek |
| Surface | `components/ui/surface.tsx` | Permukaan kartu dengan lima varian |
| Avatar | `components/ui/avatar.tsx` | Inisial staf/pasien |
| MetricTile | `components/ui/metric-tile.tsx` | Metrik ringkas dashboard |
| BrandMark | `components/ui/brand-mark.tsx` | Tanda merek vektor |
| IconButton | `components/ui/icon-button.tsx` | Aksi ikon dengan label aksesibilitas |
| BottomSheet | `components/ui/bottom-sheet.tsx` | Panel modal dari bawah |
| ProgressRail | `components/ui/progress-rail.tsx` | Progres form multi-langkah |
| UnderlineTabs | `components/ui/underline-tabs.tsx` | Tab langkah EMR |
| TicketCard | `components/ui/ticket-card.tsx` | Tiket antrean dengan sobekan |
| EmptyNote | `components/ui/empty-note.tsx` | State kosong dengan tindakan |
| BarRow | `components/ui/bar-row.tsx` | Bar horizontal laporan |

### ActionButton

- Tone: `ink` (utama netral), `teal` (aksi positif), `outline` (sekunder),
  `quiet` (netral lembut), `danger` (destruktif).
- Ukuran: `sm` 36 px, `md` 46 px, `lg` 52 px.
- Radius `md`, border 1 px, label 700.
- Mendukung ikon kiri/kanan, loading, disabled, full width.
- Saat disabled/loading, opacity 0,5 dan `accessibilityState` diperbarui.
- Jangan memakai dua tombol `teal` bersebelahan; pilih satu aksi utama.

### TextField dan SearchField

- Tinggi minimal 48 px; multiline minimal 98 px.
- Label 9 px uppercase, field memakai `paperWarm`.
- Fokus: border teal dan latar `tealTint`.
- Error: border merah, latar `redSoft`, pesan spesifik di bawah field.
- Placeholder memakai `muted` agar tetap terbaca.
- `required` ditandai bintang coralDeep, bukan hanya warna.
- Field nonaktif memakai `canvasDeep` dan teks `muted`.

### Tag

- Label 9 px uppercase, weight 800, radius 6 px.
- Selalu menyertakan teks; dot/icon hanya pendukung.
- Tone: neutral, teal, amber, rose, blue, violet, green, coral, ink, red.
- Tag tidak untuk kalimat panjang atau ajakan bertindak.
- Gunakan `coral` untuk prioritas, `amber` untuk stok rendah/menunggu,
  `green` untuk selesai/lunas, `red` untuk error/kedaluwarsa.

### Surface

| Varian | Latar | Pemakaian |
| --- | --- | --- |
| `outline` | Putih + border | Kartu standar |
| `flat` | CanvasDeep | Blok informasi sekunder |
| `dark` | Ink | Hero ringkasan, kartu pendapatan |
| `teal` | TealTint + border | Sorotan positif |
| `paper` | PaperWarm | Permukaan hangat |

Radius `lg` (20), padding default 16. Elevated hanya untuk varian outline.

### BottomSheet

- Modal transparan dengan backdrop overlay dan animasi slide.
- Sudut atas `xl + 4`, handle kecil, tombol tutup berlabel.
- Tinggi maksimum 92%, konten scroll, footer tetap terlihat.
- Dipakai untuk pembayaran, penyesuaian stok, serah terima, kredensial baru,
  dan kuitansi.
- Aksi destruktif harus memakai konfirmasi eksplisit.

### TicketCard

Kartu tiket adalah pola tanda tangan visual:

- Gradien navy–teal gelap, dekorasi lingkaran lembut.
- Nomor antrean besar, tabular, tebal.
- Sobekan kiri–kanan dengan garis putus-putus.
- Footer memuat prioritas atau estimasi dan wordmark.
- Varian compact untuk daftar; varian besar untuk sorotan dashboard.

### Komponen lain

- **MetricTile**: label 8 px, nilai 21 px, hint 8,5 px; minimum width 86 px;
  tone mengikuti status, bukan dekorasi.
- **Avatar**: inisial dari nama, warna tint peran; tidak memuat foto pada demo.
- **IconButton**: wajib punya `label` untuk screen reader; ukuran visual 38–40,
  hitSlop 6–8.
- **ProgressRail**: tiga langkah; langkah aktif teal, selesai dengan ikon centang;
  jangan dipakai untuk lebih dari lima langkah.
- **UnderlineTabs**: tab langkah EMR; tab aktif bergaris teal; status selesai
  ditandai ikon.
- **BarRow**: label, nilai, dan bar; nilai selalu ditampilkan sebagai teks.
- **EmptyNote**: ikon, judul, deskripsi, dan satu aksi opsional; jangan
  menampilkan layar kosong tanpa penjelasan.

---

## 8. Pola layar

### 1. Bento dashboard

Dua kartu metrik per baris, satu hero antrean/tiket, lalu daftar aktivitas.
Gunakan warna permukaan untuk membedakan jenis informasi, tetapi jaga jumlah
aksen dalam satu layar.

### 2. Dark hero + ticket cutout

Login, beranda, profil pasien, EMR, dan kuitansi memakai permukaan gelap dengan
teks putih. Pola ini memberi fokus dan kontras, bukan sekadar dekorasi. Jangan
menumpuk dua hero gelap dalam satu layar.

### 3. Ledger / buku besar

Dipakai untuk stok dan riwayat pembayaran: baris rapi, angka tabular, label
kolom jelas, status di kanan. Angka penting dirata-kanan agar mudah dibandingkan.

### 4. Timeline vertikal

Dipakai pada perjalanan tiket: dibuat, dipanggil, selesai/dibatalkan. Garis
vertikal dan titik status membantu membaca urutan tanpa tabel.

### 5. Wizard multi-langkah

Dipakai pada pasien (3 langkah) dan EMR (4 langkah). Setiap langkah memiliki
judul, penjelasan singkat, validasi sendiri, dan progres yang terlihat. Footer
lengket memuat tombol kembali/lanjut atau simpan.

### 6. Accordion tagihan

Tagihan di kasir dibuka per pasien. Ringkasan menampilkan nomor, nama, total,
dan status; rincian baris muncul setelah dibuka. Hanya satu panel terbuka pada
satu waktu agar layar tidak terlalu panjang.

### 7. Receipt / kuitansi

Kuitansi memakai permukaan terang, garis putus-putus, total tebal, dan label
metode/waktu. Aksi “Bagikan kuitansi” berada di footer sheet. Data yang
dibagikan harus sama dengan yang tampil di layar.

### 8. Empty state yang actionable

Setiap daftar kosong menjelaskan mengapa kosong dan apa langkah berikutnya:
misalnya “Tidak ada tagihan terbuka” dengan tombol ke riwayat atau beranda.
Jangan hanya menampilkan ikon.

---

## 9. Bahasa dan konten

### Nada

- Tenang, jelas, dan membantu.
- Tidak menyalahkan pengguna (“Data belum lengkap”, bukan “Input Anda salah”).
- Menghindari istilah teknis internal seperti “state”, “payload”, atau “error
  500”.
- Tindakan memakai kata kerja: “Simpan EMR”, “Panggil berikutnya”, “Bagikan
  kuitansi”.

### Format

| Data | Format | Contoh |
| --- | --- | --- |
| Rupiah | `Rp` + titik ribuan | `Rp 25.000` |
| Rupiah ringkas | `rb` / `jt` | `Rp 1,2 jt` |
| Tanggal | `d MMM yyyy` | `8 Nov 2026` |
| Tanggal panjang | `Senin, 8 November 2026` | Header dan konteks |
| Waktu | `HH.mm` | `08.25` |
| Nomor antrean | Kode poli + 3 digit | `UM-004` |
| Nomor RM | `RM-YYYY-NNNN` | `RM-2026-0001` |
| NIK | 16 digit, ditampilkan termask | `3273••••••••0001` |

### Label status

| Status | Label | Tone |
| --- | --- | --- |
| Menunggu | `Menunggu` | amber |
| Dipanggil | `Dipanggil` | teal/blue |
| Selesai | `Selesai` | green |
| Dibatalkan | `Dibatalkan` | rose/neutral |
| Tagihan terbuka | `Belum dibayar` | amber |
| Tagihan lunas | `Lunas` | green |
| Stok rendah | `Stok rendah` | amber |
| Kedaluwarsa | `Kedaluwarsa` | red |
| Resep diserahkan | `Diserahkan` | green |

### Contoh mikro copy

- “Lengkapi nama pengguna dan kata sandi terlebih dahulu.”
- “Nama pengguna sudah dipakai. Pilih nama lain.”
- “Stok Amoksisilin tidak cukup. Tersedia 34 kapsul.”
- “Resep ini sudah diserahkan dan tidak dapat diubah.”
- “EMR terkunci karena tagihan sudah lunas.”
- “Tidak ada antrean aktif di poli ini.”

Hindari: “Error!”, “Invalid input”, “Silakan isi dengan benar”, atau pesan
tanpa langkah pemulihan.

---

## 10. Interaksi dan motion

- Tekanan tombol memakai opacity 0,6–0,9; tidak ada animasi berlebihan.
- Bottom sheet memakai animasi slide native.
- Perubahan status langsung terlihat setelah aksi; tidak ada optimistic UI
  palsu tanpa data.
- Loading ditampilkan pada tombol atau layar boot, bukan spinner layar penuh
  untuk setiap aksi.
- Fokus keyboard mengikuti warna teal; keyboard dismiss on drag pada halaman
  scroll.
- Toast/alert singkat boleh dipakai untuk konfirmasi, tetapi status kritis juga
  harus tercermin pada data dan badge.
- Tidak ada animasi yang menghalangi pengguna menyelesaikan tugas; dukungan
  reduced motion perlu ditambahkan pada iterasi produksi.

---

## 11. Aksesibilitas

Target minimum adalah **WCAG 2.2 AA** untuk teks dan kontrol utama, dengan
catatan bahwa audit perangkat fisik belum seluruhnya dilakukan.

### Yang sudah diterapkan

- Tombol dan tab memakai `accessibilityRole`, `accessibilityState`, dan
  `accessibilityLabel` pada komponen bersama.
- Tombol ikon memiliki label yang bermakna.
- Status memakai teks + warna, bukan warna saja.
- Kontras teks utama dan tag diverifikasi pada bagian 3.
- Target sentuh utama minimal 44 px (tombol md/lg, field 48 px); elemen kecil
  seperti pill 33 px tetap memiliki jarak dan dapat dijangkau.
- Form memiliki label, hint, required marker, dan pesan error.
- Modal memakai `accessibilityViewIsModal` dan tombol tutup berlabel.
- Angka memakai format lokal dan tabular untuk keterbacaan.

### Yang perlu diuji pada perangkat nyata

- VoiceOver (iOS) dan TalkBack (Android) untuk seluruh alur.
- Dynamic type / font scale besar.
- Navigasi keyboard dan fokus pada web.
- Kontras pada layar dengan cahaya luar.
- Ukuran target sentuh pada perangkat kecil.
- Preferensi reduced motion.

Jangan mengklaim aplikasi “fully accessible” sebelum pengujian tersebut
dilakukan dan temuan diperbaiki.

---

## 12. Responsif dan lintas platform

- Konten dibatasi 760 px dan dipusatkan pada layar lebar.
- Padding halaman 20 px; dock memberi ruang bawah 124 px.
- Dashboard memakai flex row yang dapat membungkus; hindari lebar tetap.
- Form satu kolom pada ponsel; dua kolom hanya untuk field pendek dengan label
  yang tetap terbaca.
- Teks panjang memakai `numberOfLines` dan `flexShrink` agar tidak mendorong
  elemen lain keluar layar.
- Angka besar memakai `adjustsFontSizeToFit` pada kartu tiket.
- Web digunakan sebagai target build dan QA layout, bukan pengganti uji
  perangkat native.
- Share sheet, status bar, dan safe area mengikuti platform; jangan
  mengasumsikan perilaku web sama dengan iOS/Android.

---

## 13. Do and don't

### Do

- Gunakan token dari `src/core/theme.ts`.
- Gunakan komponen bersama sebelum membuat komponen lokal.
- Tampilkan state kosong, error, loading, dan disabled.
- Tulis pesan yang menyebutkan penyebab dan langkah berikutnya.
- Uji tampilan pada lebar 360 px dan tablet/web.
- Pertahankan satu aksi utama per area.
- Sertakan label teks pada status.
- Periksa kembali istilah klinis bersama reviewer.

### Don't

- Menyalin layout atau komponen dari aplikasi referensi.
- Menulis hex baru di layar tanpa alasan; pengecualian hanya untuk gradient
  dekoratif, overlay, atau bayangan yang sudah terpusat.
- Memakai coral sebagai teks normal di atas latar terang.
- Menyembunyikan status penting hanya dengan warna.
- Memakai lebih dari dua jenis aksen dalam satu kartu.
- Menaruh tombol aksi utama di bawah dock atau tertutup keyboard.
- Menampilkan dialog sistem untuk kesalahan yang bisa diselesaikan inline.
- Mengklaim integrasi BPJS/SIMPUS pada demo.

---

## 14. Panduan kontribusi

1. **Mulai dari token.** Periksa apakah warna, jarak, radius, atau tipografi sudah
   tersedia di `src/core/theme.ts`.
2. **Gunakan atau perluas komponen bersama.** Jika pola dipakai di dua layar,
   pindahkan ke `src/components`.
3. **Jaga route tetap tipis.** Route hanya mengompilasi layar; logika bisnis
   berada di `src/features`.
4. **Rancang state lengkap.** Sertakan normal, kosong, error, loading, disabled,
   dan terkunci.
5. **Uji peran.** Buka layar dengan peran yang berhak dan tidak berhak.
6. **Jalankan quality gate.**
   ```bash
   npx tsc --noEmit
   npx expo lint
   npx expo export --platform web
   ```
7. **Perbarui dokumentasi.** Perubahan token atau pola wajib tercatat di file
   ini; perubahan aturan bisnis dicatat di `docs/SCRUM.md` dan QA checklist.

### Konvensi penamaan

- Komponen: `PascalCase` dan nama file `kebab-case`.
- Hook/provider: `useAuth`, `AuthProvider`, `useClinic`, `ClinicProvider`.
- Token: camelCase untuk tema, misalnya `tealDeep`, `paperWarm`.
- Route: bahasa Indonesia, `kebab-case`, misalnya `pasien/daftar`.
- Teks UI: bahasa Indonesia; kode, tipe, dan nama fungsi tetap bahasa Inggris.

---

## 15. Peta referensi

- Token: `src/core/theme.ts`
- Navigasi dan peran: `src/core/navigation.ts`
- Format dan validasi: `src/core/format.ts`
- Kerangka layar: `src/components/layout/`
- Pustaka UI: `src/components/ui/`
- Alur bisnis: `src/features/clinic/`
- Aset merek: `scripts/generate-brand-assets.ps1`
- Konfigurasi Expo: `app.json`
- Checklist implementasi: `docs/QA-CHECKLIST.md`
