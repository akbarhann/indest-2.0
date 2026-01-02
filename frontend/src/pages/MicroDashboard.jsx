import React, { useState, useEffect, useMemo } from 'react';
import {
    MapContainer, TileLayer, Marker, Popup, Tooltip as MapTooltip, useMapEvents, CircleMarker, useMap
} from 'react-leaflet';
import VillageSearch from '../components/VillageSearch';
import axios from 'axios';
import {
    ArrowLeft, Loader2, MapPin, Signal, Wifi, Zap, Droplets, Flame, Sun,
    School, Factory, AlertTriangle, Stethoscope, ShieldAlert, HeartPulse, User
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList
} from 'recharts';

// --- Helper Components & Transforms ---

const COLORS = {
    pln: '#0EA5E9', // Sky 500
    nonPln: '#F59E0B', // Amber 500
    none: '#EF4444', // Red 500
    primary: '#3B82F6',
    secondary: '#F97316',
};

// --- Component: Map Click Listener ---
const LocationSetter = ({ onLocationSet }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationSet(lat, lng);
        },
    });
    return null;
};

// --- Component: Map Auto Center ---
const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 14);
    }, [center, map]);
    return null;
};

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
);

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
        {children}
    </div>
);

const MicroDashboard = ({ villageId, onBack, onSelectVillage, userLocation, onManualUpdate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);



    // Define handleSearchSelect
    const handleSearchSelect = (id) => {
        if (onSelectVillage) {
            onSelectVillage(id);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            console.log("Fetching data for village:", villageId);
            try {
                const res = await axios.get(`http://localhost:8000/api/micro/${villageId}`);
                console.log("API Success:", res.data);
                setData(res.data.data);
                setLoading(false);
            } catch (e) {
                console.error("API Error Details:", e.response || e);
                setLoading(false);
            }
        };
        fetchData();
    }, [villageId]);

    // --- Transformasi Data ---

    const healthFacilitiesData = useMemo(() => {
        if (!data?.health) return [];
        return [
            { name: 'RS', count: data.health.jumlah_rumah_sakit || 0 },
            { name: 'Puskesmas', count: data.health.jumlah_puskesmas || 0 },
            { name: 'Klinik', count: data.health.jumlah_klinik || 0 },
            { name: 'Poskesdes/Polindes', count: data.health.jumlah_faskes_masyarakat || 0 },
            { name: 'Apotek', count: data.health.jumlah_farmasi || 0 },
        ];
    }, [data]);

    const energyData = useMemo(() => {
        if (!data?.infrastructure) return [];
        return [
            { name: 'PLN', value: data.infrastructure.State_electricity_company || 0, color: COLORS.pln },
            { name: 'Non-PLN', value: data.infrastructure.Non_state_electricity_company || 0, color: COLORS.nonPln },
            { name: 'Tidak Ada', value: data.infrastructure.non_electricity || 0, color: COLORS.none },
        ].filter(item => item.value > 0);
    }, [data]);

    const signalValue = useMemo(() => {
        const strength = (data?.digital?.signal_strength || '').toLowerCase();
        if (strength.includes('sangat kuat')) return 100;
        if (strength.includes('kuat')) return 75;
        if (strength.includes('lemah') || strength.includes('cukup')) return 25;
        return 0;
    }, [data]);

    const btsComparisonData = useMemo(() => {
        return [
            { name: 'Desa', count: data?.digital?.bts_count || 0, fill: '#3B82F6' },
            { name: 'Rata-rata Kec', count: 2.5, fill: '#E5E7EB' } // Mock avg
        ];
    }, [data]);

    const economicFacilitiesData = useMemo(() => {
        if (!data?.economy) return [];
        return [
            { name: 'Pasar', count: (data.economy.markets || 0) },
            { name: 'Toko', count: (data.economy.grocery || 0) },
            { name: 'Rumah Makan', count: (data.economy.eatery || 0) + (data.economy.restaurant || 0) },
            { name: 'Hotel', count: (data.economy.hotels || 0) },
            { name: 'Bank', count: (data.economy.banks || 0) + (data.economy.bank || 0) }, // merging bank types if any
            { name: 'Koperasi', count: (data.economy.cooperatives || 0) },
            { name: 'BUMDes', count: (data.economy.bumdes || 0) }
        ];
    }, [data]);

    const educationStackData = useMemo(() => {
        if (!data?.education) return [];
        return [
            { name: 'SD', Negeri: data.education.sd_negeri || 0, Swasta: data.education.sd_swasta || 0 },
            { name: 'MI', Negeri: data.education.mi_negeri || 0, Swasta: data.education.mi_swasta || 0 },
            { name: 'SMP', Negeri: data.education.smp_negeri || 0, Swasta: data.education.smp_swasta || 0 },
            { name: 'MTs', Negeri: data.education.mts_negeri || 0, Swasta: data.education.mts_swasta || 0 },
            { name: 'SMA', Negeri: data.education.sma_negeri || 0, Swasta: data.education.sma_swasta || 0 },
            { name: 'MA', Negeri: data.education.ma_negeri || 0, Swasta: data.education.ma_swasta || 0 },
            { name: 'SMK', Negeri: data.education.smk_negeri || 0, Swasta: data.education.smk_swasta || 0 },
            { name: 'PT', Negeri: data.education.universities_negeri || 0, Swasta: data.education.universities_swasta || 0 },
        ];
    }, [data]);

    const disasterRadarData = useMemo(() => {
        if (!data?.disaster) return [];
        const mapping = {
            'Banjir': data.disaster.flood_exist,
            'Longsor': data.disaster.landslide_exist,
            'Gempa': data.disaster.earthquake_exist,
            'Gelombang Air Laut': data.disaster.tsunami_exist,
            'Kekeringan': data.disaster.drought_exist
        };
        return Object.entries(mapping).map(([key, val]) => ({
            subject: key,
            A: val === 'ada' ? 1 : 0,
            fullMark: 1
        }));
    }, [data]);

    const diseaseHeatmapData = useMemo(() => {
        if (!data?.disease) return [];
        const diseases = [
            { name: 'Demam Berdarah', cases: data.disease.dbd_cases, deaths: data.disease.dbd_deaths },
            { name: 'Malaria', cases: data.disease.malaria_cases, deaths: data.disease.malaria_deaths },
            { name: 'Muntaber', cases: data.disease.muntaber_cases, deaths: data.disease.muntaber_deaths },
            { name: 'Campak', cases: data.disease.campak_cases, deaths: data.disease.campak_deaths },
            { name: 'SARS', cases: data.disease.sars_cases, deaths: data.disease.sars_deaths },
            { name: 'Hepatitis E', cases: data.disease.hepatitis_e_cases, deaths: data.disease.hepatitis_e_deaths },
            { name: 'Difteri', cases: data.disease.difteri_cases, deaths: data.disease.difteri_deaths },
            { name: 'COVID-19', cases: data.disease.covid_cases, deaths: data.disease.covid_deaths },

        ];

        return diseases.map(d => ({
            ...d,
            cfr: d.cases > 0 ? ((d.deaths / d.cases) * 100).toFixed(1) : 0
        })).sort((a, b) => b.cases - a.cases); // Sort by cases descending
    }, [data]);


    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
    if (!data) return <div className="p-20 text-center text-gray-500">Data tidak tersedia</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 bg-gray-50 min-h-screen">

            {/* --- Bagian 1: Header Hero Dinamis --- */}
            <div className="relative h-80 w-full overflow-hidden rounded-b-3xl shadow-lg group">
                <div className="absolute inset-0 bg-gray-900/40 z-10" />
                <img
                    src="https://via.placeholder.com/1600x600/10b981/ffffff?text=Pedesaan+Indonesia"
                    alt="Pemandangan Desa"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute top-6 left-6 z-20">
                    <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-gray-900/90 to-transparent flex flex-col md:flex-row justify-between items-end">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-600/90 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                                {data.status || 'Desa'}
                            </span>
                            {data.topography && (
                                <span className="px-3 py-1 bg-emerald-600/90 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                                    {data.topography}
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{data.name}</h1>
                        <p className="text-gray-200 text-lg flex items-center gap-2">
                            <MapPin size={18} /> Kecamatan {data.district}
                            {data.forest_location && <span className="text-emerald-300">• {data.forest_location}</span>}
                        </p>
                    </div>

                    <div className="hidden md:block overflow-hidden rounded-xl border border-white/30 shadow-lg w-72 h-40 bg-gray-200 relative group/map">
                        <MapContainer
                            center={[data.latitude, data.longitude]}
                            zoom={14}
                            zoomControl={false}
                            className="h-full w-full"
                        >
                            <ChangeView center={[data.latitude, data.longitude]} />
                            <LocationSetter onLocationSet={onManualUpdate} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Village Marker */}
                            <Marker position={[data.latitude, data.longitude]}>
                                <Popup>
                                    <div className="text-center font-bold">Pusat Desa {data.name}</div>
                                </Popup>
                            </Marker>

                            {/* User Location Marker */}
                            {userLocation && (
                                <CircleMarker
                                    center={[userLocation.lat, userLocation.lng]}
                                    pathOptions={{ color: '#3B82F6', fillColor: '#60A5FA', fillOpacity: 0.8 }}
                                    radius={6}
                                >
                                    <Popup>
                                        <div className="text-center">
                                            <strong className="text-blue-600 block mb-1">Anda di Sini</strong>
                                            <div className="text-[10px] text-gray-400">
                                                Akurasi: {userLocation.accuracy}m
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            )}
                        </MapContainer>

                        <div className="absolute bottom-2 left-2 z-[1000] pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 text-gray-700">
                                Klik peta untuk kalibrasi lokasi <MapPin size={8} className="text-blue-500" />
                            </div>
                        </div>

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 z-[1000] bg-white/90 hover:bg-white text-gray-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover/map:opacity-100 transition-opacity"
                        >
                            Gmaps
                        </a>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8 space-y-12">

                {/* --- Bagian 2: Infrastruktur & Kesenjangan Digital --- */}
                <section>
                    <SectionTitle title="Infrastruktur & Konektivitas" subtitle="Bauran energi, kesiapan digital, dan utilitas dasar." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Komponen A: Bauran Energi */}
                        <Card>
                            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Zap size={18} className="text-amber-500" /> Sumber Energi
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={energyData}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {energyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Komponen B: Kesiapan Digital */}
                        <Card className="flex flex-col">
                            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Signal size={18} className="text-blue-500" /> Kesiapan Digital
                            </h3>
                            <div className="flex items-center justify-between mb-6">
                                <div className="relative flex items-center justify-center w-24 h-24">
                                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                                    <div
                                        className={`absolute inset-0 rounded-full border-4 border-t-transparent ${signalValue >= 75 ? 'border-green-500' :
                                            signalValue >= 50 ? 'border-yellow-500' : 'border-red-500'
                                            }`}
                                        style={{ transform: 'rotate(-45deg)', clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
                                    ></div>
                                    <span className="text-xl font-bold text-gray-700">{signalValue}%</span>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                        {data.digital?.signal_type || 'Tidak Diketahui'} <Signal size={14} />
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-sm font-medium">

                                        <span className={data.digital?.signal_strength?.toLowerCase().includes('kuat') ? "text-green-600" : "text-yellow-600"}>
                                            {data.digital?.signal_strength || 'Tidak Diketahui'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-auto border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Menara BTS</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{data.digital?.bts_count || 0}</span>
                                        <Wifi size={14} className="text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Sistem Informasi</span>
                                    {(data.digital?.village_information_system || '').toLowerCase() === 'ada' ? (
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktif</span>
                                    ) : (
                                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Tidak Ada</span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Komponen C: Utilitas Dasar */}
                        <Card>
                            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Droplets size={18} className="text-cyan-500" /> Utilitas Dasar
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-cyan-50 rounded-lg flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-cyan-600">
                                        <Droplets size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-cyan-800 uppercase font-bold">Sumber Air</p>
                                        <p className="text-sm font-medium text-gray-700">{data.infrastructure?.water_drink_source || 'Tidak Diketahui'}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-orange-600">
                                        <Flame size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-800 uppercase font-bold">Bahan Bakar Memasak</p>
                                        <p className="text-sm font-medium text-gray-700">{data.infrastructure?.cooking_fuel || 'Tidak Diketahui'}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-lg flex items-center gap-3 relative overflow-hidden">
                                    {/* Lencana Eco Surya */}
                                    {(data.infrastructure?.rural_solar_street_lights === 'ada' || data.infrastructure?.rural_solar_street_lights?.toLowerCase().includes('ada')) && (
                                        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                            ECO
                                        </div>
                                    )}
                                    <div className="bg-white p-2 rounded-full shadow-sm text-yellow-600">
                                        <Sun size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-yellow-800 uppercase font-bold">Penerangan Jalan</p>
                                        <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                            {data.infrastructure?.rural_main_street_lights || 'Tidak Diketahui'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* --- Bagian 3: Ekonomi & Pendidikan --- */}
                <section>
                    <SectionTitle title="Mesin Pertumbuhan" subtitle="Potensi ekonomi dan akses pendidikan." />
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Komponen A: Struktur Ekonomi & Industri */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Card 1: Penghasilan Utama */}
                            <Card>
                                <h3 className="font-semibold text-gray-700 mb-4 text-sm">Penghasilan Utama</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.economy?.primary_income?.split(',').map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium border border-emerald-200">
                                            {tag.trim()}
                                        </span>
                                    )) || <span className="text-gray-400 text-xs">Tidak ada data</span>}
                                </div>
                            </Card>

                            {/* Card 2: Industri Lokal (Selalu Tampil) */}
                            <Card className="bg-indigo-50 border-indigo-100">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-indigo-900 text-sm">Industri Lokal</h3>
                                    </div>
                                    <Factory size={18} className="text-indigo-500" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-indigo-800">
                                        <span>Industri Galian</span>
                                        <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-sm">
                                            {data.economy?.non_metallic_mining_industry || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-indigo-800">
                                        <span>Industri Kertas & Bubur</span>
                                        <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-sm">
                                            {data.economy?.paper_and_pulp_industry || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-indigo-800">
                                        <span>Industri Percetakan</span>
                                        <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-sm">
                                            {data.economy?.printing_industry || 0}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Komponen B: Fasilitas Ekonomi */}
                        <Card className="lg:col-span-1">
                            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Fasilitas Ekonomi</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={economicFacilitiesData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Komponen D: Ketersediaan Pendidikan (Lebar) */}
                        <Card className="lg:col-span-2">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <School size={18} className="text-pink-500" /> Akses Pendidikan
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={educationStackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="Negeri" stackId="a" fill="#3B82F6" />
                                        <Bar dataKey="Swasta" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-center text-gray-500 mt-2">
                                * Perbandingan fasilitas Negeri vs Swasta (SD, MI, SMP, MTs, SMA, MA, SMK, PT)
                            </p>
                        </Card>
                    </div>
                </section>

                {/* --- Bagian 4: Risiko & Kerentanan --- */}
                <section>
                    <SectionTitle title="Risiko & Kesejahteraan" subtitle="Ketahanan bencana, kesehatan masyarakat, dan stabilitas sosial." />

                    {/* Container khusus Detail Kesehatan (Diatas Penyakit) */}
                    <Card className="mb-6 border-blue-100 bg-blue-50/50">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg">Detail Fasilitas Kesehatan</h3>
                            <div className="h-px flex-1 bg-blue-200"></div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={healthFacilitiesData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 14, fontWeight: 500 }} />
                                    <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={32}>
                                        <LabelList dataKey="count" position="right" style={{ fill: '#374151', fontSize: 14, fontWeight: 'bold' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Komponen A: Radar Risiko Bencana */}
                        <Card className="lg:col-span-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-700 text-sm">Profil Bencana</h3>
                                {data.disaster?.warning_system === 'ada' ? (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">EWS Aktif</span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200">Tidak Ada EWS</span>
                                )}
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius="80%" data={disasterRadarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                                        <Radar name="Risiko" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.4} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Komponen B: Peta Panas Kesehatan Masyarakat (Semua Penyakit) */}
                        <Card className="lg:col-span-2 overflow-hidden">
                            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Stethoscope size={18} className="text-rose-500" /> Pemantauan Penyakit
                            </h3>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="border-b border-gray-100 text-gray-500">
                                            <th className="text-left pb-2 font-medium">Penyakit</th>
                                            <th className="text-right pb-2 font-medium">Kasus</th>
                                            <th className="text-right pb-2 font-medium">Meninggal</th>
                                            <th className="text-right pb-2 font-medium">CFR (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {diseaseHeatmapData.map((row, i) => (
                                            <tr key={i} className={`border-b border-gray-50 last:border-0 ${parseFloat(row.cfr) > 2 ? 'bg-red-50 text-red-700' :
                                                parseFloat(row.cfr) > 0 ? 'bg-orange-50 text-orange-700' : 'text-gray-600'
                                                }`}>
                                                <td className="py-2.5 font-medium">{row.name}</td>
                                                <td className="text-right py-2.5">{row.cases}</td>
                                                <td className="text-right py-2.5">{row.deaths}</td>
                                                <td className="text-right py-2.5 font-bold">{row.cfr}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Komponen C & D: Statistik & Peringatan */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Rasio Medis */}
                            <Card className="bg-blue-50 border-blue-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><HeartPulse size={20} /></div>
                                    <p className="text-xs text-blue-800 font-bold uppercase">Rasio Medis</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-800">
                                    {data.health?.total_fasilitas_kesehatan > 0
                                        ? ((data.health.jumlah_dokter + data.health.jumlah_bidan) / data.health.total_fasilitas_kesehatan).toFixed(1)
                                        : '0'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Nakes per Fasilitas</p>
                                <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Dokter:</span>
                                        <span className="font-mono">{data.health?.jumlah_dokter || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bidan:</span>
                                        <span className="font-mono">{data.health?.jumlah_bidan || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Fasilitas:</span>
                                        <span className="font-mono">{data.health?.total_fasilitas_kesehatan || 0}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Peringatan Kriminal */}
                            {data.criminal && (data.criminal.murderer_case_man > 0 || data.criminal.murderer_case_woman > 0 || data.criminal.suicide_count_man > 0) && (
                                <Card className="bg-red-50 border-red-100 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert size={24} className="text-red-600 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-red-800 text-sm">Peringatan Kritis</h4>
                                            <p className="text-xs text-red-600 mt-1 leading-tight">Perlu intervensi sosial. Tingkat kriminal/bunuh diri tinggi terdeteksi.</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Info Disabilitas */}
                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><User size={12} /> Disabilitas</h4>
                                <div className="flex flex-wrap gap-1">
                                    {data.disease?.disability_population > 0 ? (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">Total: {data.disease.disability_population}</span>
                                    ) : <span className="text-xs text-gray-400">Tidak ada data</span>}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
};

export default MicroDashboard;
