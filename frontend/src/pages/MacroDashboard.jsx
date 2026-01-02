import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, Tooltip as LeafletTooltip, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import VillageSearch from '../components/VillageSearch';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, Signal, TrendingUp, AlertTriangle, Map as MapIcon,
    Zap, ShoppingBag, Eye, HeartPulse, ArrowRight
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
    useEffect(() => {
        if (coords) {
            map.flyTo([coords.lat, coords.lng], 14, { animate: true, duration: 1.5 });
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
    const [lens, setLens] = useState('risk'); // 'risk' | 'digital' | 'economy'

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // If we already have boundaries, just fetch villages
                if (cachedBoundaries) {
                    const res = await axios.get('http://localhost:8000/api/macro');
                    setVillages(res.data.data);
                    setBoundaries(cachedBoundaries);
                } else {
                    const [vRes, bRes] = await Promise.all([
                        axios.get('http://localhost:8000/api/macro'),
                        axios.get('http://localhost:8000/api/boundaries').catch(() => ({ data: null }))
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
        if (!villages.length) return {};

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
                { label: 'Total BTS', value: sum('digital.bts_count') }
            ],

            economicPower: sum('economy.markets') + sum('economy.bumdes'),
            ecoDetails: [
                { label: 'Pasar', value: sum('economy.markets') },
                { label: 'BUMDes', value: sum('economy.bumdes') },
                { label: 'Koperasi', value: sum('economy.cooperatives') }
            ],

            healthAlert: sum('disease.infectious_cases'),
            healthDetails: [
                { label: 'Demam Berdarah', value: sum('disease.dbd_cases') },
                { label: 'Muntaber', value: sum('disease.muntaber_cases') },
                { label: 'Malaria', value: sum('disease.malaria_cases') }
            ]
        };
    }, [villages]);

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
        if (lens === 'economy') {
            // Biru jika ada pasar/bumdes
            const hasEconomy = (v.economy?.markets > 0) || (v.economy?.bumdes > 0);
            return { color: hasEconomy ? '#3B82F6' : '#9CA3AF', radius: hasEconomy ? 6 : 3 };
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

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) return <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Pusat Komando Eksekutif</h1>
                    <p className="text-gray-500 dark:text-gray-400">Pemantauan situasi wilayah secara real-time.</p>
                </div>
                <div className="w-full md:w-72 z-50">
                    <VillageSearch onSelect={onSelectVillage} initialVillages={villages} />
                </div>
            </div>

            {/* KPI Ticker */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Populasi Berisiko"
                    value={kpi.popRisk}
                    label="Warga Rentan"
                    icon={HeartPulse}

                    color="bg-red-500"
                    delay="animate-fade-in-up delay-100"
                    details={kpi.popDetails}
                />
                <StatCard
                    title="Digital Index"
                    value={`${kpi.connectivity}%`}
                    label="Connected Villages"
                    icon={Signal}

                    color="bg-blue-500"
                    delay="animate-fade-in-up delay-200"
                    details={kpi.connectDetails}
                />
                <StatCard
                    title="Economic Power"
                    value={kpi.economicPower}
                    label="Active Markets & BUMDes"
                    icon={ShoppingBag}

                    color="bg-emerald-500"
                    delay="animate-fade-in-up delay-300"
                    details={kpi.ecoDetails}
                />
                <StatCard
                    title="Health Alert"
                    value={kpi.healthAlert}
                    label="Active Cases (DBD/Malaria)"
                    icon={AlertTriangle}

                    color="bg-orange-500"
                    delay="animate-fade-in-up delay-400"
                    details={kpi.healthDetails}
                />
            </div>

            {/* 2. Interactive Map Centerpiece */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]" >
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    {/* Map Filters & Legend (Top Right) */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
                        {/* Filter Buttons */}
                        <div className="bg-white/90 backdrop-blur shadow-lg p-2 rounded-xl flex gap-2">
                            <LensButton
                                active={lens === 'risk'}
                                onClick={() => setLens('risk')}
                                icon={AlertTriangle}
                                label="Risiko"
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
                        </div>

                        {/* Dynamic Legend */}
                        <div className="bg-white/90 backdrop-blur shadow-md px-4 py-2 rounded-lg text-xs font-medium text-gray-600 flex flex-col gap-1 min-w-[140px]">
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
                < div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden" >
                    <div className="px-6 py-4 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800">Need Attention</h3>
                            <p className="text-xs text-red-500">Highest Risk / Case Count</p>
                        </div>
                        <AlertTriangle className="text-red-500" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Desa</th>
                                    <th className="px-6 py-3 text-right">Infectious Cases</th>
                                    <th className="px-6 py-3 text-right">EWS Status</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRiskVillages.map((v, i) => (
                                    <tr key={i} className="bg-white border-b hover:bg-red-50/50 transition">
                                        <td className="px-6 py-3 font-medium text-gray-900">{v.name}</td>
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
                < div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden" >
                    <div className="px-6 py-4 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800">Top Potentials</h3>
                            <p className="text-xs text-emerald-600">Economic Hub Candidates</p>
                        </div>
                        <ShoppingBag className="text-emerald-500" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Desa</th>
                                    <th className="px-6 py-3 text-right">Markets + BUMDes</th>
                                    <th className="px-6 py-3 text-right">Signal</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topEconomyVillages.map((v, i) => (
                                    <tr key={i} className="bg-white border-b hover:bg-emerald-50/50 transition">
                                        <td className="px-6 py-3 font-medium text-gray-900">{v.name}</td>
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Sumber Penghasilan Utama</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={incomeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {incomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Kesenjangan Infrastruktur (Listrik)</h3>
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
