# Audit Arsitektur Teknis: Indest

Dokumen ini menjelaskan kronologi pembangunan sistem dari layer data hingga antarmuka pengguna, ditujukan untuk keperluan audit teknis.

## 1. Domain Modeling & Database Schema
Sistem dibangun di atas **PostgreSQL** menggunakan **SQLModel** (wrapper Pydantic + SQLAlchemy) untuk mendefinisikan skema relasional yang ketat.

### Desain Skema (`backend/models.py`)
Root entity adalah `Village` yang menjadi parent bagi entity domain spesifik. Relasi menggunakan pola **One-to-One** untuk memecah kompleksitas tabel.

- **`Village` (Root)**: Menyimpan atribut statis (ID, koordinat geospasial, topografi).
- **Sub-Modules**:
    - `Health`, `Education`, `Economy`, `Infrastructure`, `Digital`, `Disaster`, `Disease`, `Criminal`.
    - Menggunakan Foreign Key `village_id` yang me-refer ke `Village.id`.
- **AI Analysis**: Tabel terpisah `AIAnalysis` dengan kolom `JSON` untuk menyimpan output non-deterministik dari LLM (SWOT, rekomendasi).

**Rationale**: Normalisasi parsial dilakukan untuk memisahkan domain data. Penggunaan `selectinload` pada query level (di `main.py`) mencegah N+1 problem saat fetching data agresif.

## 2. Ingestion & ETL Pipeline
Data awal tidak diinput manual, melainkan melalui proses ETL (Extract, Transform, Load) dari CSV mentah (`podes_dashboard_data.csv`).

### Migrasi Data (`data/migrate.py`)
Script ini bertindak sebagai seeder idempoten:
1.  **Drop & Recreate**: `SQLModel.metadata.drop_all` menjamin state bersih sebelum loading.
2.  **Streaming Read**: Menggunakan `csv.DictReader` untuk iterasi baris demi baris, meminimalkan memory footprint dibanding me-load seluruh dataframe pandas.
3.  **Data Cleaning**: Fungsi `parse_int` dan `parse_decimal` menangani *dirty data* (string kosong, nilai null) secara defensif menjadi default value (0 atau 0.0).
4.  **Transaction Management**: `session.add()` dilakukan per baris, dengan `session.commit()` dilakukan secara batch (di akhir loop) untuk integritas atomicity.

## 3. Backend Service Layer API
Backend dibangun menggunakan **FastAPI** untuk performa asinkronus tinggi dan validasi tipe otomatis.

### Core Components (`backend/main.py`)
- **Dependency Injection**: `get_session` di-inject ke setiap route handler, memastikan life-cycle koneksi database terisolasi per request.
- **Micro-Caching**: Implementasi in-memory caching sederhana (`MACRO_CACHE`) pada endpoint `/api/macro` untuk mengurangi load database pada query agregat brat. Time-to-live di-set 300 detik.
- **Response Models**: Menggunakan Pydantic models (`schemas.py`) untuk memfilter data yang keluar (DTO pattern), mencegah kebocoran atribut internal ORM ke klien.

### Business Logic
Logika kalkulasi (seperti Indeks Kemandirian, Health Radar) dienkapsulasi dalam `ScoringAlgorithm` (`backend/services/analytics.py`), memisahkan *concern* antara HTTP handling dan domain logic.

## 4. Frontend Architecture
Frontend adalah Single Page Application (SPA) berbasis **React** dengan build tool **Vite**.

### State & Data Flow
- **Fetching**: Menggunakan `axios` di dalam `useEffect`.
- **Optimization**: `useMemo` digunakan secara agresif di `MacroDashboard.jsx` untuk kalkulasi derivatif (KPI, chart data) di sisi klien. Ini memindahkan beban komputasi dari server ke browser klien (distributed computing).

### Visualization Stack
- **Geospatial**: `react-leaflet` me-render peta interaktif. Rendering ribuan marker dioptimalkan dengan membatasi kompleksitas DOM node.
- **Charts**: `recharts` digunakan untuk visualisasi statistik.

## 5. Security & Deployment Considerations (Audit Notes)
- **CORS**: Saat ini diset ke `allow_origins=["*"]`. **Rekomendasi Audit**: Harus dipersempit ke domain production spesifik saat deployment.
- **Environment Variables**: Konfigurasi DB credential via `os.getenv` mendukung prinsip 12-factor app.
- **Database Connection**: Tidak ada connection pooling eksplisit di `database.py` (menggunakan default SQLAlchemy engine). Untuk high concurrency, disarankan menggunakan PgBouncer atau konfigurasi pool size di SQLAlchemy.
