import React from 'react';
import { Activity } from 'lucide-react';

const AboutPage = () => {
    return (
        <div className="p-6 h-full flex items-center justify-center bg-brand-light dark:bg-slate-900 overflow-y-auto">
            <div className="max-w-3xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Activity className="text-blue-600 dark:text-blue-400" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tentang Website</h1>
                </div>

                <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                    <p>
                        <strong className="text-blue-600 dark:text-blue-400">INDEST</strong> dikembangkan sebagai respons terhadap kebutuhan akan penyediaan informasi desa yang akurat, terkini, dan mudah diakses. Website ini dirancang sebagai platform informasi desa yang bersifat interaktif untuk mendukung manajemen data serta penyebaran informasi statistik desa secara terstruktur dan efisien.
                    </p>
                    <p>
                        Melalui INDEST, data dan indikator desa disajikan dalam bentuk yang lebih informatif dan mudah dipahami, sehingga dapat dimanfaatkan oleh masyarakat, pemerintah desa, serta pemangku kepentingan lainnya dalam proses perencanaan, evaluasi, dan pengambilan keputusan berbasis data.
                    </p>
                    <p>
                        Pengembangan website ini merupakan bagian dari kegiatan magang mahasiswa di Badan Pusat Statistik Kabupaten Lamongan, sekaligus menjadi wujud kontribusi mahasiswa dalam mendukung transparansi informasi dan peningkatan kualitas pelayanan data kepada masyarakat.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
