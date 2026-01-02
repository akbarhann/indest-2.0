# Development Rules: Village Intelligence & Profile Dashboard

## 1. General Principles
- **Accuracy First**: Pastikan semua logika scoring (Health, Education, Resilience) mengikuti formula matematis yang didefinisikan di `specs.md`.
- **Performance**: Komponen frontend harus dioptimalkan; gunakan lazy loading untuk modul yang menggunakan peta (Leaflet).
- **Privacy**: Jangan pernah mengirim data mentah identitas warga ke API LLM eksternal. Lakukan anonimisasi atau agregasi data sebelum pemrosesan prompt.

## 2. Backend & API Rules (Python/FastAPI)
- **Code Style**: Patuhi pedoman PEP 8.
- **Data Validation**: Gunakan model **Pydantic** untuk semua request body dan response schema.
- **Error Handling**: Implementasikan global exception handlers untuk mengembalikan response JSON error yang standar.
- **Security**: 
    - Simpan API keys (LLM) dan kredensial Database di file `.env`.
    - Validasi semua upload CSV untuk tipe file dan struktur sebelum diproses.
- **Logic Separation**: Pisahkan logika perhitungan matematis ke dalam modul khusus `backend/services/analytics.py`.

## 3. Database Rules (PostgreSQL)
- **Schema Integrity**: Gunakan Foreign Keys untuk relasi antar desa/wilayah.
- **Naming Convention**: Gunakan `snake_case` untuk semua nama tabel dan kolom.
- **Data Types**: Gunakan `DECIMAL` untuk koordinat/rasio dan `JSONB` untuk menyimpan hasil SWOT dinamis dari AI.
- **Indexing**: Buat index pada kolom yang sering difilter (misal: `village_id`, `district_name`).

## 4. Frontend Rules (Tailwind CSS / JS)
- **Component Architecture**: Pecah dashboard menjadi komponen kartu yang bisa digunakan kembali (e.g., `StatCard`, `MapContainer`, `IndeksGauge`).
- **Responsive Design**: Pendekatan Mobile-first. Pastikan peta "Macro View" dapat digunakan di tablet.
- **Visualization**:
    - **Chart.js**: Gunakan untuk Resilience Scatter Plot dan Independence Gauges.
    - **Leaflet.js**: Gunakan untuk peta Health Radar dan Digital Gap.
- **Color Palette**:
    - **Red (#EF4444)**: High Risk / Low Supply.
    - **Yellow (#F59E0B)**: Resilient / Warning.
    - **Green (#10B981)**: Safe / High Potential.

## 5. AI & Machine Learning Rules
- **Clustering (K-Means)**: Lakukan standarisasi/normalisasi data sebelum clustering agar variabel topografi dan ekonomi memiliki bobot yang adil.
- **LLM Prompting**:
    - Gunakan *structured system prompts* untuk memastikan format output SWOT konsisten.
    - Implementasikan mekanisme *fallback* (output berbasis aturan/rule-based) jika API AI tidak tersedia.
- **Reproducibility**: Tetapkan `random_state` pada K-Means agar persona desa tidak berubah secara acak saat reload.

## 6. File & Directory Structure
Agen harus mengikuti struktur berikut:
- `/backend`: Logika inti, API routes, dan model ML.
- `/frontend`: React/Tailwind code dan assets.
- `/data`: File CSV mentah dan skrip migrasi.
- `/docs`: `specs.md`, `rules.md`, dan dokumentasi API.
- `requirements.txt`: Daftar semua dependensi Python.

## 7. Version Control & Workflow
- **Branching**: Gunakan format `feature/nama-fitur`.
- **Commits**: Gunakan pesan deskriptif (e.g., `feat: implement health radar logic`).
- **Validation**: Setiap perubahan backend harus lolos uji validasi pengolahan CSV.