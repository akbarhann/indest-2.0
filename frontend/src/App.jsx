import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import MacroDashboard from './pages/MacroDashboard'; // We will create this next
import MicroDashboard from './pages/MicroDashboard'; // Placeholder for now
import TeamPage from './pages/TeamPage';
import AboutPage from './pages/AboutPage';

function App() {
    // DEBUG: Hardcoded for testing
    const [view, setView] = useState('macro');
    const [selectedVillageId, setSelectedVillageId] = useState('3524010001');
    const [locationStatus, setLocationStatus] = useState({
        status: 'idle', // idle, locating, success, error
        coords: null,
        accuracy: null,
        message: ''
    });

    // Theme State
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    // Apply Theme to HTML tag
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Geolocation: Auto-select nearest village on load
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus({ status: 'error', message: 'Geolocation not supported' });
            return;
        }

        setLocationStatus({ status: 'locating', message: 'Locating...' });
        console.log("Requesting high-accuracy location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log(`Location found: ${latitude}, ${longitude} (Acc: ${accuracy}m)`);
                setLocationStatus({
                    status: 'success',
                    coords: { lat: latitude.toFixed(6), lng: longitude.toFixed(6) },
                    accuracy: Math.round(accuracy),
                    message: 'Location found'
                });

                try {
                    const res = await axios.get(`http://localhost:8000/api/nearest-village?lat=${latitude}&long=${longitude}`);
                    if (res.data?.id) {
                        console.log(`Nearest Village: ${res.data.name} (${res.data.distance_km}km)`);
                        setSelectedVillageId(res.data.id);
                        setLocationStatus(prev => ({
                            ...prev,
                            message: `Nearest: ${res.data.name} (${res.data.distance_km}km)`
                        }));
                    }
                } catch (e) {
                    console.error("Failed to find nearest village:", e);
                    setLocationStatus(prev => ({ ...prev, message: 'Failed to fetch nearest village' }));
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setLocationStatus({ status: 'error', message: `Error: ${err.message}` });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    useEffect(() => {
        detectLocation();
    }, []);

    const handleVillageSelect = (id) => {
        setSelectedVillageId(id);
        setView('micro');
    };

    // Manual Location Calibration
    const handleManualLocation = async (lat, lng) => {
        console.log(`Manual location set: ${lat}, ${lng}`);
        setLocationStatus({
            status: 'success',
            coords: { lat: lat.toFixed(6), lng: lng.toFixed(6) },
            accuracy: 'Manual',
            message: 'Pinned on map'
        });

        try {
            const res = await axios.get(`http://localhost:8000/api/nearest-village?lat=${lat}&long=${lng}`);
            if (res.data?.id) {
                console.log(`Nearest Village (Manual): ${res.data.name} (${res.data.distance_km}km)`);
                setSelectedVillageId(res.data.id);
                setLocationStatus(prev => ({
                    ...prev,
                    message: `Nearest: ${res.data.name} (${res.data.distance_km}km) • Manual`
                }));
            }
        } catch (e) {
            console.error("Failed to find nearest village:", e);
        }
    };

    return (
        <Layout setView={setView} theme={theme} setTheme={setTheme}>
            {view === 'macro' && (
                <MacroDashboard
                    onSelectVillage={handleVillageSelect}
                    userLocation={locationStatus.coords ? { ...locationStatus.coords, accuracy: locationStatus.accuracy } : null}
                    onManualUpdate={handleManualLocation}
                />
            )}

            {view === 'micro' && (
                <div className="p-4">
                    {selectedVillageId ? (
                        <MicroDashboard villageId={selectedVillageId} onBack={() => setView('macro')} onSelectVillage={handleVillageSelect} />
                    ) : (
                        <div className="text-center text-gray-500 mt-20">
                            <h2 className="text-xl font-semibold">No Village Selected</h2>
                            <p>Please select a village from the Macro View map.</p>
                            <button
                                onClick={() => setView('macro')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                            >
                                Go to Map
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'team' && <TeamPage />}
            {view === 'about' && <AboutPage />}

            {/* Location Debug Pill */}
            <div className="fixed bottom-4 left-4 z-[2000] bg-black/80 backdrop-blur text-white text-xs p-3 rounded-xl flex items-center gap-3 shadow-lg border border-white/10 max-w-sm">
                <div className={`w-2 h-2 rounded-full ${locationStatus.status === 'locating' ? 'bg-yellow-400 animate-pulse' :
                    locationStatus.status === 'success' ? 'bg-emerald-400' :
                        locationStatus.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                <div className="flex flex-col">
                    <span className="font-semibold">
                        {locationStatus.coords ? `${locationStatus.coords.lat}, ${locationStatus.coords.lng}` : 'Waiting for location...'}
                    </span>
                    <span className="text-gray-400">
                        {locationStatus.accuracy ? `Accuracy: ${locationStatus.accuracy}m` : ''}
                        {locationStatus.accuracy > 1000 && <span className="text-red-400 font-bold ml-1">(Low Accuracy - Using ISP?)</span>}
                        {locationStatus.message ? ` • ${locationStatus.message}` : ''}
                    </span>
                </div>
                <button
                    onClick={detectLocation}
                    className="ml-auto bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                >
                    RETRY
                </button>
            </div>
        </Layout>
    );
}

export default App;
