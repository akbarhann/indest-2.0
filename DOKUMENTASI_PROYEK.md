# Indest - Village Intelligence Dashboard

Indest adalah platform dashboard intelijen data desa yang dirancang untuk memberikan wawasan mendalam mengenai kondisi geografis, sosial, dan ekonomi desa di Indonesia. Proyek ini menggabungkan analisis data tradisional dengan kecerdasan buatan (AI) untuk membantu pengambil kebijakan dan masyarakat memahami potensi serta tantangan di tingkat desa.

## 🚀 Fitur Utama

### 1. Macro Dashboard (Pandangan Regional)
Memberikan gambaran umum statistik desa dalam skala yang lebih luas.
- **Visualisasi Geografis**: Pemetaan lokasi desa menggunakan Leaflet.
- **Analisis Agregat**: Statistik kesehatan, pendidikan, dan ekonomi lintas desa.
- **Filter & Pencarian**: Memudahkan pencarian desa berdasarkan nama atau wilayah.

### 2. Micro Dashboard (Profil Detail Desa)
Menyediakan data spesifik dan mendalam untuk satu desa terpilih.
- **Skor Radar Kesehatan**: Visualisasi cakupan layanan kesehatan.
- **Corong Pendidikan (Education Funnel)**: Analisis tingkat partisipasi sekolah.
- **Indeks Kemandirian Desa**: Mengukur tingkat perkembangan desa (Mandiri, Maju, Berkembang, dll).
- **Matriks Resiliensi**: Analisis risiko bencana dan kriminalitas.

### 3. AI Insights (Analisis Berbasis AI)
Menggunakan Google Gemini API untuk menghasilkan narasi cerdas yang tidak tersedia dalam data mentah.
- **Persona Desa**: Memberikan identitas unik pada setiap desa.
- **Narasi Local Hero**: Mengidentifikasi potensi modal sosial.
- **Analisis SWOT**: Kekuatan (Strengths), Kelemahan (Weaknesses), Peluang (Opportunities), dan Ancaman (Threats) yang dipersonalisasi.
- **Rekomendasi Strategis**: Langkah-langkah konkret yang disarankan oleh AI untuk pengembangan desa.

## 🛠️ Arsitektur Teknologi

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL dengan [SQLModel](https://sqlmodel.tiangolo.com/) (ORM)
- **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Data Processing**: NumPy & Pandas

### Frontend
- **Framework**: [React](https://reactjs.org/) dengan Vite
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/) & [Recharts](https://recharts.org/)
- **Maps**: [React Leaflet](https://react-leaflet.js.org/)
- **Icons**: Lucide React

## 📂 Struktur Proyek

```text
indest/
├── backend/          # API Service (FastAPI)
│   ├── main.py       # Entry point API
│   ├── models.py     # Definisi skema database
│   ├── services/     # Logika bisnis & pengolahan data
│   └── database.py   # Konfigurasi koneksi DB
├── frontend/         # Aplikasi Web (React)
│   ├── src/
│   │   ├── components/  # Komponen UI reusable
│   │   ├── pages/       # Halaman utama (Macro/Micro)
│   │   └── services/    # Integrasi API client
├── data/             # Script migrasi dan file CSV mentah
└── scripts/          # Utility scripts untuk manajemen proyek
```

## 📊 Sumber Data
Proyek ini menggunakan data dari **Podes (Potensi Desa)** yang telah diolah secara digital untuk menghasilkan metrik-metrik yang relevan. Proses migrasi data dilakukan menggunakan script Python yang membersihkan dan memetakan data CSV ke database relasional.

---
*Proyek ini dikembangkan untuk memfasilitasi pengambilan keputusan berbasis data (evidence-based policy) di tingkat pemerintahan daerah dan desa.*
