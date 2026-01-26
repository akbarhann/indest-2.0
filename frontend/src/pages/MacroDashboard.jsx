import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, Tooltip as LeafletTooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VillageSearch from '../components/VillageSearch';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, Signal, TrendingUp, AlertTriangle, Map as MapIcon,
    Zap, ShoppingBag, Eye, HeartPulse, ArrowRight, Mountain, Home, Droplets, Waves,
    CloudRain, CloudOff, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility: Class Merger ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- Component: Map Auto Center ---
const AutoPan = ({ coords }) => {
    const map = useMap();
    const lastPanTime = useRef(0);

    useEffect(() => {
        if (coords) {
            const now = Date.now();
            // Throttle updates: only pan if >10 mins have passed or it's the first time
            if (now - lastPanTime.current > 10 * 60 * 1000) {
                map.flyTo([coords.lat, coords.lng], 14, { animate: true, duration: 1.5 });
                lastPanTime.current = now;
            }
        }
    }, [coords, map]);
    return null;
};

// --- Component: Stat Card ---
const StatCard = ({ title, value, label, icon: Icon, trend, color, delay, details = [] }) => (
    <div className={cn(
        "bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 relative group z-10 hover:z-[2000]",
        delay
    )}>
        <div className="flex justify-between items-start mb-2">
            <div className={cn("p-2 rounded-lg", color)}>
                <Icon size={20} className="text-white" />
            </div>
            {trend && (
                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-100 dark:border-green-800 flex items-center gap-1">
                    <TrendingUp size={10} /> {trend}
                </span>
            )}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mt-1">{title}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{label}</p>

        {/* Hover Details Overlay */}
        {details.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-t-0 border-gray-100 dark:border-gray-700 rounded-b-xl shadow-xl p-4 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 transform origin-top translate-y-[-10px] group-hover:translate-y-0 z-50">
                <div className="space-y-2">
                    {details.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                            <span className="font-bold text-gray-700 dark:text-gray-200">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// --- Component: Map Lens Button ---
const LensButton = ({ active, onClick, icon: Icon, label, colorClass }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border",
            active
                ? cn("text-white ring-2 ring-offset-1 border-transparent", colorClass)
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        )}
    >
        <Icon size={14} />
        {label}
    </button>
);

// --- Component: Map Click Listener ---
const LocationSetter = ({ onLocationSet }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            // Confirm with user (simple alert for now, or direct update)
            // Let's do direct update for speed, or a small confirmation toast if needed.
            // For now: direct.
            onLocationSet(lat, lng);
        },
    });
    return null;
};

// Global cache to prevent redownloading 1.6MB every switch
let cachedBoundaries = null;

const MacroDashboard = ({ onSelectVillage, userLocation, onManualUpdate }) => {
    const [villages, setVillages] = useState([]);
    const [boundaries, setBoundaries] = useState(cachedBoundaries);
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lens, setLens] = useState('risk'); // 'risk' | 'digital' | 'economy' | 'topography'

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // If we already have boundaries, just fetch villages
                if (cachedBoundaries) {
                    const res = await axios.get('/api/macro');
                    setVillages(res.data.data);
                    setBoundaries(cachedBoundaries);
                } else {
                    const [vRes, bRes] = await Promise.all([
                        axios.get('/api/macro'),
                        axios.get('/api/boundaries').catch(() => ({ data: null }))
                    ]);
                    setVillages(vRes.data.data);
                    if (bRes.data) {
                        cachedBoundaries = bRes.data;
                        setBoundaries(bRes.data);
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch macro data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- KPIs ---
    const kpi = useMemo(() => {
        if (!villages.length) return {
            popRisk: 0,
            popDetails: [],
            connectivity: 0,
            connectDetails: [],
            economicPower: 0,
            ecoDetails: [],
            healthAlert: 0,
            healthDetails: [],
            topographyDominance: "N/A",
            topographyDetails: [],
            totalVillages: 0,
            waterStats: { count: 0, details: [] },
            disasterStats: { flood: 0, flash_flood: 0, landslide: 0, drought: 0 }
        };

        // Helper Sum
        const sum = (fieldPath) => villages.reduce((acc, v) => {
            const val = fieldPath.split('.').reduce((o, i) => o?.[i], v);
            return acc + (Number(val) || 0);
        }, 0);

        return {
            popRisk: sum('disease.disability_population'),
            popDetails: [
                { label: 'Avg per Village', value: Math.round(sum('disease.disability_population') / villages.length) },
                { label: 'Max (Single Village)', value: Math.max(...villages.map(v => v.disease?.disability_population || 0)) }
            ],

            connectivity: Math.round((villages.filter(v => (v.digital?.village_information_system || '').toLowerCase().includes('ada')).length / villages.length) * 100),
            connectDetails: [
                { label: 'Sinyal Kuat', value: villages.filter(v => (v.digital?.signal_strength || '').toLowerCase().includes('kuat')).length },
                { label: 'Sinyal Lemah', value: villages.filter(v => (v.digital?.signal_strength || '').toLowerCase().includes('lemah')).length }
            ],

            economicPower: sum('economy.markets') + sum('economy.bumdes') + sum('economy.cooperatives') + sum('economy.industries'),
            ecoDetails: [
                { label: 'Pasar', value: sum('economy.markets') },
                { label: 'BUMDes', value: sum('economy.bumdes') },
                { label: 'Koperasi', value: sum('economy.cooperatives') },
                { label: 'Industri', value: sum('economy.industries') }
            ],

            healthAlert: sum('disease.infectious_cases'),
            healthDetails: [
                { label: 'Demam Berdarah', value: sum('disease.dbd_cases') },
                { label: 'Muntaber', value: sum('disease.muntaber_cases') },
                { label: 'Malaria', value: sum('disease.malaria_cases') }
            ],

            // Topography Dominance
            topographyDominance: (() => {
                const total = villages.length;
                if (!total) return "N/A";
                const dataran = villages.filter(v => (v.topography || '').toLowerCase().includes('dataran')).length;
                const percent = Math.round((dataran / total) * 100);
                return `${percent}% Dataran`;
            })(),
            topographyDetails: (() => {
                const total = villages.length;
                if (!total) return [];
                const dataran = villages.filter(v => (v.topography || '').toLowerCase().includes('dataran')).length;
                const lereng = villages.filter(v => (v.topography || '').toLowerCase().includes('lereng')).length;
                const puncak = villages.filter(v => (v.topography || '').toLowerCase().includes('puncak')).length;

                return [
                    { label: 'Dataran', value: `${Math.round((dataran / total) * 100)}%` },
                    { label: 'Lereng', value: `${Math.round((lereng / total) * 100)}%` },
                    { label: 'Puncak', value: `${Math.round((puncak / total) * 100)}%` }
                ];
            })(),

            totalVillages: villages.length,

            // Water KPIs
            waterStats: (() => {
                const total = villages.length;
                if (!total) return { count: 0, details: [] };

                // "Sumber air minum sebagian besar keluarga selain air isi ulang dan air kemasan bermerek"
                // Logic: Filter OUT 'isi ulang', 'kemasan', 'botol', 'bermerek'
                const naturalWaterVillages = villages.filter(v => {
                    const src = (v.infrastructure?.water_drink_source || '').toLowerCase();
                    const isPackaged = src.includes('isi ulang') || src.includes('kemasan') || src.includes('botol') || src.includes('bermerek');
                    return !isPackaged;
                });

                // Detailed Breakdown for the Narrative
                const sumur = naturalWaterVillages.filter(v => (v.infrastructure?.water_drink_source || '').toLowerCase().includes('sumur')).length;
                const hujan = naturalWaterVillages.filter(v => (v.infrastructure?.water_drink_source || '').toLowerCase().includes('hujan')).length;
                const mataAir = naturalWaterVillages.filter(v => (v.infrastructure?.water_drink_source || '').toLowerCase().includes('mata air')).length;
                const sungai = naturalWaterVillages.filter(v => (v.infrastructure?.water_drink_source || '').toLowerCase().includes('sungai')).length;

                return {
                    count: naturalWaterVillages.length,
                    details: [
                        { label: 'Sumur', value: sumur },
                        { label: 'Mata Air', value: mataAir },
                        { label: 'Air Hujan', value: hujan },
                        { label: 'Sungai/Lainnya', value: sungai }
                    ].filter(d => d.value > 0) // Only show relevant
                };
            })(),


            disasterStats: (() => {
                // Strict check: must be exactly 'ada' after trim/lowercase
                const countRisk = (field) => villages.filter(v => {
                    const val = (v.disaster?.[field] || '').trim().toLowerCase();
                    return val === 'ada';
                }).length;

                return {
                    flood: countRisk('flood_exist'),
                    flash_flood: countRisk('flash_flood_exist'),
                    landslide: countRisk('landslide_exist'),
                    drought: countRisk('drought_exist')
                };
            })()
        };
    }, [villages]);

    // Disaster Incidents


    // --- View Logic (Smart Lenses) ---
    const getMarkerStyle = (v) => {
        if (lens === 'risk') {
            // Merah jika ada pengungsi bencana atau kasus penyakit tinggi
            const isHighRisk = (v.disaster?.disaster_exist === 'ada') || (v.disease?.infectious_cases > 5);
            return { color: isHighRisk ? '#EF4444' : '#10B981', radius: isHighRisk ? 6 : 4 };
        }
        if (lens === 'digital') {
            // Hijau jika Sistem Informasi Desa 'Ada'
            const hasSystem = (v.digital?.village_information_system || '').toLowerCase().includes('ada');
            return { color: hasSystem ? '#10B981' : '#F59E0B', radius: hasSystem ? 6 : 4 };
        }
        // New Disaster Lenses - Strict Check
        const checkRisk = (val) => (val || '').trim().toLowerCase() === 'ada';

        if (lens === 'flood') {
            const isProne = checkRisk(v.disaster?.flood_exist) || checkRisk(v.disaster?.flash_flood_exist);
            return { color: isProne ? '#EF4444' : '#E5E7EB', radius: isProne ? 6 : 3 };
        }
        if (lens === 'landslide') {
            const isProne = checkRisk(v.disaster?.landslide_exist);
            return { color: isProne ? '#D97706' : '#E5E7EB', radius: isProne ? 6 : 3 };
        }
        if (lens === 'drought') {
            const isProne = checkRisk(v.disaster?.drought_exist);
            return { color: isProne ? '#F59E0B' : '#E5E7EB', radius: isProne ? 6 : 3 };
        }
        if (lens === 'economy') {
            // Biru jika ada pasar/bumdes
            const hasEconomy = (v.economy?.markets > 0) || (v.economy?.bumdes > 0);
            return { color: hasEconomy ? '#3B82F6' : '#9CA3AF', radius: hasEconomy ? 6 : 3 };
        }
        if (lens === 'topography') {
            const t = (v.topography || '').toLowerCase();
            if (t.includes('dataran')) return { color: '#10B981', radius: 5 }; // Green
            if (t.includes('lereng')) return { color: '#F59E0B', radius: 5 }; // Orange
            if (t.includes('puncak')) return { color: '#8B5CF6', radius: 6 }; // Purple
            return { color: '#6B7280', radius: 4 }; // Gray unknown
        }
        // Water Source Lens - 5 Categories
        if (lens === 'water') {
            const source = (v.infrastructure?.water_drink_source || '').toLowerCase();
            // Sumur (includes "sumur" and "sumur bor atau pompa")
            if (source.includes('sumur')) return { color: '#3B82F6', radius: 5 }; // Blue
            // Air Hujan
            if (source.includes('hujan')) return { color: '#06B6D4', radius: 5 }; // Cyan
            // Mata Air
            if (source.includes('mata air')) return { color: '#10B981', radius: 5 }; // Green
            // PDAM (includes "ledeng dengan meteran" and "ledeng tanpa meteran")
            if (source.includes('ledeng') || source.includes('pdam') || source.includes('pam')) return { color: '#8B5CF6', radius: 5 }; // Purple
            // Kemasan (includes "air isi ulang" and "air kemasan bermerek")
            if (source.includes('isi ulang') || source.includes('kemasan')) return { color: '#F59E0B', radius: 5 }; // Amber
            return { color: '#9CA3AF', radius: 4 }; // Gray - Unknown
        }
        return { color: '#6B7280', radius: 4 };
    };

    // --- Leaderboards ---
    const topRiskVillages = useMemo(() => {
        return [...villages]
            .sort((a, b) => (b.disease?.infectious_cases || 0) - (a.disease?.infectious_cases || 0))
            .slice(0, 5);
    }, [villages]);

    const topEconomyVillages = useMemo(() => {
        return [...villages]
            .sort((a, b) => ((b.economy?.markets || 0) + (b.economy?.bumdes || 0)) - ((a.economy?.markets || 0) + (a.economy?.bumdes || 0)))
            .slice(0, 5);
    }, [villages]);

    // --- Charts Data ---
    const incomeData = useMemo(() => {
        const counts = {};
        villages.forEach(v => {
            const income = v.economy?.primary_income?.split(',')[0] || 'Lainnya';
            counts[income] = (counts[income] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [villages]);

    const infraData = useMemo(() => {
        const pln = villages.filter(v => v.infrastructure?.State_electricity_company > 0).length;
        const nonPln = villages.filter(v => v.infrastructure?.Non_state_electricity_company > 0).length;
        const none = villages.filter(v => v.infrastructure?.non_electricity > 0).length;
        return [
            { name: 'PLN', value: pln },
            { name: 'Non-PLN', value: nonPln },
            { name: 'Tidak Ada', value: none },
        ];
    }, [villages]);

    // --- Industry by District Data (for Stacked Bar Chart) ---
    const industryByDistrictData = useMemo(() => {
        const districtMap = {};

        villages.forEach(v => {
            const district = v.district || 'Unknown';
            if (!districtMap[district]) {
                districtMap[district] = {
                    name: district,
                    galian: 0,
                    kertas: 0,
                    percetakan: 0,
                    makanan: 0
                };
            }
            districtMap[district].galian += v.economy?.non_metallic_mining_industry || 0;
            districtMap[district].kertas += v.economy?.paper_and_pulp_industry || 0;
            districtMap[district].percetakan += v.economy?.printing_industry || 0;
            // Use eatery + restaurant as proxy for food industry
            districtMap[district].makanan += (v.economy?.eatery || 0) + (v.economy?.restaurant || 0);
        });

        // Sort by total industries descending
        return Object.values(districtMap)
            .sort((a, b) => (b.galian + b.kertas + b.percetakan + b.makanan) - (a.galian + a.kertas + a.percetakan + a.makanan));
    }, [villages]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const INDUSTRY_COLORS = { galian: '#6366F1', kertas: '#10B981', percetakan: '#F59E0B', makanan: '#EF4444' };

    if (loading) return <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard Kabupaten Lamongan 2024</h1>
                    <p className="text-gray-500 dark:text-gray-400">Pemantauan situasi wilayah secara real-time.</p>
                </div>
                <div className="w-full md:w-72 z-50">
                    <VillageSearch onSelect={onSelectVillage} initialVillages={villages} />
                </div>
            </div>

            {/* Row 1: Core Metrics - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Desa"
                    value={kpi.totalVillages}
                    label="Wilayah Terdaftar"
                    icon={Home}
                    color="bg-indigo-500"
                    delay="animate-fade-in-up delay-100"
                />
                <StatCard
                    title="Populasi Berisiko"
                    value={kpi.popRisk}
                    label="Warga Rentan"
                    icon={HeartPulse}
                    color="bg-red-500"
                    delay="animate-fade-in-up delay-200"
                    details={kpi.popDetails}
                />
                <StatCard
                    title="Koneksi Internet"
                    value={`${kpi.connectivity}%`}
                    label="Desa Terkoneksi"
                    icon={Signal}
                    color="bg-blue-500"
                    delay="animate-fade-in-up delay-300"
                    details={kpi.connectDetails}
                />
                <StatCard
                    title="Pilar Ekonomi"
                    value={kpi.economicPower}
                    label="Unit Usaha & Industri"
                    icon={ShoppingBag}
                    color="bg-emerald-500"
                    delay="animate-fade-in-up delay-400"
                    details={kpi.ecoDetails}
                />
            </div >

            {/* Row 2: Environment & Infrastructure - 3 columns */}
            < div className="grid grid-cols-1 sm:grid-cols-3 gap-4" >
                <StatCard
                    title="Dominasi Topografi"
                    value={kpi.topographyDominance}
                    label="Distribusi Wilayah"
                    icon={Mountain}
                    color="bg-purple-500"
                    delay="animate-fade-in-up delay-500"
                    details={kpi.topographyDetails}
                />
                <StatCard
                    title="Air Minum Non-Kemasan"
                    value={kpi.waterStats.count}
                    label="Desa dengan Sumber Alami"
                    icon={Droplets}
                    color="bg-cyan-500"
                    delay="animate-fade-in-up delay-600"
                    details={kpi.waterStats.details}
                />
                <div className="hidden sm:block"></div> {/* Spacer for visual balance */}
            </div >

            {/* Row 3: Disaster Risks - 4 columns with section header */}
            < div className="space-y-3" >
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    Potensi Kerawanan Bencana
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                        title="Rawan Banjir"
                        value={kpi.disasterStats.flood}
                        label="Desa Berpotensi"
                        icon={CloudRain}
                        color="bg-blue-600"
                        delay="animate-fade-in-up delay-700"
                    />
                    <StatCard
                        title="Banjir Bandang"
                        value={kpi.disasterStats.flash_flood}
                        label="Desa Berpotensi"
                        icon={Waves}
                        color="bg-red-600"
                        delay="animate-fade-in-up delay-800"
                    />
                    <StatCard
                        title="Rawan Longsor"
                        value={kpi.disasterStats.landslide}
                        label="Desa Berpotensi"
                        icon={AlertCircle}
                        color="bg-amber-600"
                        delay="animate-fade-in-up delay-900"
                    />
                    <StatCard
                        title="Rawan Kekeringan"
                        value={kpi.disasterStats.drought}
                        label="Desa Berpotensi"
                        icon={CloudOff}
                        color="bg-orange-500"
                        delay="animate-fade-in-up delay-1000"
                    />
                </div>
            </div >

            {/* Industry by Kecamatan - Stacked Bar Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-indigo-500" />
                    Spesialisasi Industri Kecil/Mikro per Kecamatan
                </h3>
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: INDUSTRY_COLORS.galian }}></div> Galian</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: INDUSTRY_COLORS.kertas }}></div> Kertas</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: INDUSTRY_COLORS.percetakan }}></div> Percetakan</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: INDUSTRY_COLORS.makanan }}></div> Makanan/Minuman</div>
                </div>
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={industryByDistrictData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                        />
                        <Bar dataKey="galian" stackId="a" fill={INDUSTRY_COLORS.galian} />
                        <Bar dataKey="kertas" stackId="a" fill={INDUSTRY_COLORS.kertas} />
                        <Bar dataKey="percetakan" stackId="a" fill={INDUSTRY_COLORS.percetakan} />
                        <Bar dataKey="makanan" stackId="a" fill={INDUSTRY_COLORS.makanan} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>


            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]" >
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative group">
                    {/* Map Filters & Legend (Top Right) */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
                        {/* Filter Buttons */}
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg p-2 rounded-xl flex gap-2">
                            <LensButton
                                active={lens === 'risk'}
                                onClick={() => setLens('risk')}
                                icon={AlertTriangle}
                                label="Penyakit"
                                colorClass="bg-red-500 ring-red-500"
                            />
                            <LensButton
                                active={lens === 'digital'}
                                onClick={() => setLens('digital')}
                                icon={Signal}
                                label="Digital"
                                colorClass="bg-blue-500 ring-blue-500"
                            />
                            <LensButton
                                active={lens === 'economy'}
                                onClick={() => setLens('economy')}
                                icon={ShoppingBag}
                                label="Ekonomi"
                                colorClass="bg-emerald-500 ring-emerald-500"
                            />
                            <LensButton
                                active={lens === 'topography'}
                                onClick={() => setLens('topography')}
                                icon={Mountain}
                                label="Topografi"
                                colorClass="bg-purple-500 ring-purple-500"
                            />
                            <LensButton
                                active={lens === 'flood'}
                                onClick={() => setLens('flood')}
                                icon={CloudRain}
                                label="Banjir"
                                colorClass="bg-red-500 ring-red-500"
                            />
                            <LensButton
                                active={lens === 'landslide'}
                                onClick={() => setLens('landslide')}
                                icon={AlertCircle}
                                label="Longsor"
                                colorClass="bg-amber-600 ring-amber-600"
                            />
                            <LensButton
                                active={lens === 'drought'}
                                onClick={() => setLens('drought')}
                                icon={CloudOff}
                                label="Kekeringan"
                                colorClass="bg-orange-500 ring-orange-500"
                            />
                            <LensButton
                                active={lens === 'water'}
                                onClick={() => setLens('water')}
                                icon={Droplets}
                                label="Air Minum"
                                colorClass="bg-cyan-500 ring-cyan-500"
                            />
                        </div>

                        {/* Dynamic Legend */}
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-md px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 flex flex-col gap-1 min-w-[140px]">
                            <span className="text-[10px] uppercase text-gray-400 font-bold mb-1">Legenda Warna</span>
                            {lens === 'risk' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Risiko Tinggi / Kasus</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Zona Aman</div>
                                </>
                            )}
                            {lens === 'digital' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Sistem Aktif</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Belum Ada</div>
                                </>
                            )}
                            {lens === 'economy' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Ada Pasar/BUMDes</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400"></div> Tertinggal</div>
                                </>
                            )}
                            {lens === 'topography' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Dataran</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Lereng</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Puncak</div>
                                </>
                            )}
                            {lens === 'flood' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Rawan Banjir</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></div> Aman</div>
                                </>
                            )}
                            {lens === 'landslide' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-600"></div> Rawan Longsor</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></div> Aman</div>
                                </>
                            )}
                            {lens === 'drought' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Rawan Kekeringan</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></div> Aman</div>
                                </>
                            )}
                            {lens === 'water' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Sumur</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Air Hujan</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Mata Air</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> PDAM/Ledeng</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Kemasan</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Boundary Toggle - Moved to Bottom Right corner of map container */}
                    <div className="absolute bottom-6 right-6 z-[2000]">
                        <button
                            onClick={() => setShowBoundaries(!showBoundaries)}
                            className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xl border backdrop-blur-sm",
                                showBoundaries
                                    ? "bg-slate-800/90 text-white border-transparent"
                                    : "bg-white/90 text-gray-600 border-gray-200 hover:bg-white"
                            )}
                        >
                            <MapIcon size={14} />
                            {showBoundaries ? 'Sembunyikan Batas' : 'Tampilkan Batas'}
                        </button>
                    </div>

                    <MapContainer center={[-7.1, 112.4]} zoom={10} style={{ height: '100%', width: '100%' }}>
                        <AutoPan coords={userLocation} />
                        <LocationSetter onLocationSet={onManualUpdate} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Standard OSM
                        // Optional: Use CartoDB Positron for cleaner look
                        // url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* Village Boundaries */}
                        {boundaries && showBoundaries && (
                            <GeoJSON
                                data={boundaries}
                                style={{
                                    color: '#64748b',
                                    weight: 1,
                                    fillColor: '#94a3b8',
                                    fillOpacity: 0.1
                                }}
                                eventHandlers={{
                                    click: (e) => {
                                        L.DomEvent.stopPropagation(e.originalEvent);
                                        const feature = e.propagatedFrom.feature;
                                        if (feature && feature.properties?.iddesa) {
                                            onSelectVillage(feature.properties.iddesa);
                                        }
                                    },
                                    mouseover: (e) => {
                                        const layer = e.target;
                                        layer.setStyle({
                                            fillOpacity: 0.3,
                                            weight: 2,
                                            color: '#3B82F6'
                                        });
                                    },
                                    mouseout: (e) => {
                                        const layer = e.target;
                                        layer.setStyle({
                                            fillOpacity: 0.1,
                                            weight: 1,
                                            color: '#64748b'
                                        });
                                    }
                                }}
                            />
                        )}

                        {/* User Location Marker */}
                        {userLocation && (
                            <CircleMarker
                                center={[userLocation.lat, userLocation.lng]}
                                pathOptions={{ color: '#3B82F6', fillColor: '#60A5FA', fillOpacity: 0.8 }}
                                radius={8}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <strong className="text-blue-600 block mb-1">Anda di Sini</strong>
                                        <div className="text-xs text-gray-600">
                                            Acc: {userLocation.accuracy}m
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {userLocation.lat}, {userLocation.lng}
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        )}

                        {villages.map(v => {
                            const style = getMarkerStyle(v);
                            return (
                                <CircleMarker
                                    key={v.id}
                                    center={[v.latitude, v.longitude]}
                                    radius={style.radius}
                                    pathOptions={{ color: style.color, fillColor: style.color, fillOpacity: 0.7, weight: 1 }}
                                >
                                    <Popup className="custom-popup">
                                        <div className="text-center p-1">
                                            <h3 className="font-bold text-gray-800">{v.name}</h3>
                                            <p className="text-xs text-gray-500 mb-2">Kec. {v.district}</p>
                                            <button
                                                onClick={() => onSelectVillage(v.id)}
                                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-blue-700 transition w-full"
                                            >
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </Popup>
                                    <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                                        <span className="font-semibold text-xs">{v.name}</span>
                                    </LeafletTooltip>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div >

            {/* 3. Section: Wall of Shame & Fame (Leaderboards) */}
            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                {/* Wall of Shame (Risk) */}
                < div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden" >
                    <div className="px-6 py-4 border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Need Attention</h3>
                            <p className="text-xs text-red-500">Highest Risk / Case Count</p>
                        </div>
                        <AlertTriangle className="text-red-500" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3">Desa</th>
                                    <th className="px-6 py-3 text-right">Kasus Penyakit</th>
                                    <th className="px-6 py-3 text-right">EWS Status</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRiskVillages.map((v, i) => (
                                    <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition">
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{v.name}</td>
                                        <td className="px-6 py-3 text-right font-bold text-red-600">{v.disease?.infectious_cases || 0}</td>
                                        <td className="px-6 py-3 text-right">
                                            {v.disaster?.warning_system === 'ada'
                                                ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                                                : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full">Missing</span>
                                            }
                                        </td>
                                        <td className="px-6 py-3">
                                            <button onClick={() => onSelectVillage(v.id)} className="text-blue-600 hover:text-blue-800"><ArrowRight size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div >

                {/* Wall of Fame (Potential) */}
                < div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 overflow-hidden" >
                    <div className="px-6 py-4 border-b border-emerald-50 dark:border-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Top Potentials</h3>
                            <p className="text-xs text-emerald-600">Economic Hub Candidates</p>
                        </div>
                        <ShoppingBag className="text-emerald-500" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3">Desa</th>
                                    <th className="px-6 py-3 text-right">Markets + BUMDes</th>
                                    <th className="px-6 py-3 text-right">Signal</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topEconomyVillages.map((v, i) => (
                                    <tr key={i} className="bg-white dark:bg-slate-800 border-b dark:border-gray-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition">
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{v.name}</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-600">{(v.economy?.markets || 0) + (v.economy?.bumdes || 0)}</td>
                                        <td className="px-6 py-3 text-right text-xs">
                                            {v.digital?.signal_strength || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <button onClick={() => onSelectVillage(v.id)} className="text-blue-600 hover:text-blue-800"><ArrowRight size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div >
            </div >

            {/* 4. Section: Regional Aggregates (Charts) */}
            < div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Sumber Penghasilan Utama</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={incomeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {incomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => [`${value} Desa`, props.payload.name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        {incomeData.slice(0, 6).map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 truncate">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="truncate text-gray-600 dark:text-gray-400">{entry.name}</span>
                                <span className="ml-auto font-semibold text-gray-800 dark:text-gray-200">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Kesenjangan Infrastruktur (Listrik)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={infraData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div >

        </div >
    );
};

export default MacroDashboard;
