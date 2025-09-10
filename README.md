# BC Wash Sukarame

## 1. Overview Singkat
Aplikasi web untuk pemesanan layanan cuci kendaraan BC Wash Sukarame. Pelanggan memilih layanan, cabang, jadwal, lalu membayar dan mengunggah bukti. **Fitur penjemputan (PICKUP)** memungkinkan kendaraan dijemput dalam radius tertentu dan admin bisa membuka rute ke lokasi pelanggan via Google Maps.

## 2. Fitur Utama
- **Alur booking 5 langkah**: pilih layanan → pilih cabang & jadwal → isi data pelanggan → pilih metode bayar → unggah bukti & dapat kode booking.
- **Pickup**: radius km dapat dikonfigurasi per cabang, pelanggan pinpoint alamat pada peta, koordinat disimpan, admin dapat klik deep link `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` untuk navigasi.
- **Normalisasi plat nomor**: hapus spasi & uppercase otomatis (tidak cek pola atau duplikat).
- Upload bukti transfer ke Supabase Storage.
- Tracking status via kode booking.
- Panel admin: kelola layanan, cabang, booking, laporan, dan loyalti.

## 3. Arsitektur & Stack
- **Front-end**: Next.js App Router (React 19, TypeScript), Tailwind CSS v4, shadcn/ui, lucide icons.
- **State/Data**: React Hook Form, React Query/Zustand (lihat penggunaan pada komponen), utilitas di `lib/`.
- **Backend**: Next.js Route Handlers di `app/api/*`.
- **Database**: Supabase (Postgres + Storage) melalui `@supabase/ssr`.
- **Maps**: Google Maps JS API (Places & Geometry) + deep link rute.
- **Auth**: login admin sederhana berbasis cookie tanpa JWT atau hashing.
- **Deployment**: Vercel (konfigurasi default Next.js).

## 4. Struktur Folder
- `app/` – App Router (halaman dan API).
- `components/` – Komponen UI (booking, admin, customer, dll).
- `lib/` – Helper: util, API client, Supabase client, normalisasi.
- `database/` & `scripts/` – SQL schema dan seeding.
- `public/`, `styles/` – aset statis & styling tambahan.

## 5. Model Data & Skema
Tabel inti (nama mengikuti schema Supabase):
- **services**: `id`, `name`, `category`, `price`, `duration`, `pickup_fee`, `supports_pickup`.
- **branches**: `id`, `name`, `phone`, `address`, `pickup_coverage_radius`, `latitude`, `longitude`.
- **bookings**: `id`, `booking_code`, `customer_*`, `service_id`, `branch_id`, `booking_date`, `booking_time`, `total_price`, `status`, `is_pickup_service`, `pickup_address`, `pickup_latitude`, `pickup_longitude`, `vehicle_plate_number`, `payment_method`, `payment_proof`.
- **customers**: `id`, `name`, `phone`, `email`, `vehicle_plate_numbers`, `total_loyalty_points`, `total_bookings`, `join_date`.

Field pickup penting: `pickup_coverage_radius` pada cabang serta `pickup_latitude`, `pickup_longitude`, `pickup_address` pada booking.

## 6. Endpoint/API & Alur Teknis
Contoh route:
- `POST /api/bookings` – buat booking baru; normalisasi plat nomor dan validasi radius pickup (client & server).
- `GET /api/bookings?code=XXXX` – ambil detail booking untuk tracking.
- `PATCH /api/bookings/:id/status` – ubah status booking.
- `POST /api/services` dsb – CRUD layanan.
- `POST /api/branches` – kelola cabang beserta radius pickup.
Validasi utama: format tanggal, jam, email, telepon, serta geolokasi pickup.
Status booking: `pending → confirmed → picked-up → in-progress → completed → cancelled`.

## 7. Konfigurasi & Environment
Buat `.env.local` dengan variabel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` (default: `admin` / `bcwash2025`)
Tambahan opsional: `SUPABASE_SERVICE_ROLE_KEY`.
Pastikan Google Maps API diaktifkan dan dibatasi domain, billing aktif.

## 8. Menjalankan Proyek
Prasyarat: Node.js ≥18 dan pnpm.
```bash
pnpm install
pnpm dev
```
Build & lint:
```bash
pnpm lint
pnpm build
```

## 9. UI/UX Catatan
- Halaman `/booking` menampilkan seluruh langkah sekaligus (mobile-first) tanpa wizard berlapis.
- Halaman `/track` memiliki tombol Back agar mudah kembali.
- Admin Settings hanya berisi konfigurasi relevan; tab umum/pengguna/pembayaran sudah dihapus.
- Pickup modal menampilkan pin lokasi dan tombol buka rute Google Maps.

## 10. Keamanan, Kinerja, Aksesibilitas
- Sanitasi input, cek radius pickup di client & server.
- Lazy load Google Maps & optimasi gambar.
- Form multi-langkah menggunakan label & aria untuk aksesibilitas.
- Rate limit dasar dapat ditambahkan pada route API bila dibutuhkan.

## 11. Roadmap & Changelog Ringkas
Pengembangan berikutnya:
- Optimasi rute penjemputan & estimasi waktu.
- Notifikasi WhatsApp otomatis & email.
- Dynamic pricing & kupon.

Perubahan commit ini: naturalisasi komentar kode dan overhaul README dengan penekanan fitur pickup.
