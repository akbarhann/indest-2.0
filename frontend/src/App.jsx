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
    const [selectedVillageId, setSelectedVillageId] = useState(null); // null by default, wait for detection
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

        const backendUrl = `http://${window.location.hostname}:8000`;

        setLocationStatus({ status: 'locating', message: 'Mencari lokasi...' });
        console.log("Requesting location...");

        const handleSuccess = async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`Location found: ${latitude}, ${longitude} (Acc: ${accuracy}m)`);
            setLocationStatus({
                status: 'success',
                coords: { lat: latitude.toFixed(6), lng: longitude.toFixed(6) },
                accuracy: Math.round(accuracy),
                message: 'Lokasi ditemukan'
            });

            try {
                const res = await axios.get(`${backendUrl}/api/nearest-village?lat=${latitude}&long=${longitude}`);
                if (res.data?.id) {
                    console.log(`Nearest Village: ${res.data.name} (${res.data.distance_km}km)`);
                    setSelectedVillageId(res.data.id);
                    const method = res.data.method === 'geofence' ? '' : ` (${res.data.distance_km}km)`;
                    setLocationStatus(prev => ({
                        ...prev,
                        message: `Desa: ${res.data.name}${method}`
                    }));
                    // AUTO-NAVIGATE to Micro Dashboard if detected
                    setView('micro');
                }
            } catch (e) {
                console.error("Failed to find nearest village:", e);
                setLocationStatus(prev => ({ ...prev, message: 'Gagal mencocokkan desa' }));
            }
        };

        const handleError = (err) => {
            console.error("Geolocation error:", err);
            // If high accuracy failed, try again with low accuracy
            if (err.code === 3 || err.code === 1) { // Timeout or Permission (though permission might stick)
                setLocationStatus({ status: 'error', message: `Gagal: ${err.message}. Mencoba mode standar...` });
                navigator.geolocation.getCurrentPosition(handleSuccess, (e2) => {
                    setLocationStatus({ status: 'error', message: `Error: ${e2.message}` });
                }, { enableHighAccuracy: false, timeout: 5000 });
            } else {
                setLocationStatus({ status: 'error', message: `Error: ${err.message}` });
            }
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        });
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

        const backendUrl = `http://${window.location.hostname}:8000`;
        try {
            const res = await axios.get(`${backendUrl}/api/nearest-village?lat=${lat}&long=${lng}`);
            if (res.data?.id) {
                console.log(`Nearest Village (Manual): ${res.data.name} (${res.data.distance_km}km)`);
                setSelectedVillageId(res.data.id);
                const method = res.data.method === 'geofence' ? '' : ` (${res.data.distance_km}km)`;
                setLocationStatus(prev => ({
                    ...prev,
                    message: `Desa (Manual): ${res.data.name}${method}`
                }));
                // AUTO-NAVIGATE to Micro Dashboard on Manual Pin
                setView('micro');
            }
        } catch (e) {
            console.error("Failed to find nearest village:", e);
        }
    };

    return (
        <Layout
            setView={setView}
            theme={theme}
            setTheme={setTheme}
            locationStatus={locationStatus}
            onRetryLocation={detectLocation}
        >
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
                        <MicroDashboard
                            villageId={selectedVillageId}
                            onBack={() => setView('macro')}
                            onSelectVillage={handleVillageSelect}
                            userLocation={locationStatus.coords ? { ...locationStatus.coords, accuracy: locationStatus.accuracy } : null}
                            onManualUpdate={handleManualLocation}
                        />
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
        </Layout>
    );
}

export default App;
