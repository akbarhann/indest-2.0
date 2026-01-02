import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Legend = () => (
    <div className="absolute bottom-4 left-4 z-[9999] bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs text-gray-700">
        <h4 className="font-bold mb-2">Health Radar</h4>
        <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-risk-high opacity-80"></span>
            High Risk (Demand {'>'} Supply)
        </div>
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-risk-low opacity-80"></span>
            Safe Zone
        </div>
    </div>
);

const SetBounds = ({ locations }) => {
    const map = useMap();
    useMemo(() => {
        if (locations.length > 0) {
            const bounds = locations.map(l => [l.latitude, l.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, locations]);
    return null;
};

const VillageMap = ({ villages, onSelectVillage }) => {
    // Default center Indonesia
    const defaultCenter = [-2.5489, 118.0149];

    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
            <MapContainer
                center={defaultCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {villages.map(v => {
                    const isHighRisk = v.health_radar.status === 'High Risk';
                    const color = isHighRisk ? '#EF4444' : '#10B981'; // Tailwind red/green

                    return (
                        <CircleMarker
                            key={v.id}
                            center={[v.latitude, v.longitude]}
                            radius={8}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.7,
                                weight: 2
                            }}
                            eventHandlers={{
                                click: () => onSelectVillage(v.id)
                            }}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <strong className="block text-gray-800 text-base mb-1">{v.name}</strong>
                                    <div className={`text-xs font-bold px-2 py-1 rounded w-fit mb-2 ${isHighRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {v.health_radar.status}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
                                        <span>Supply Score:</span>
                                        <span className="font-mono text-gray-800">{v.health_radar.supply}</span>
                                        <span>Demand Score:</span>
                                        <span className="font-mono text-gray-800">{v.health_radar.demand}</span>
                                    </div>
                                    <button
                                        onClick={() => onSelectVillage(v.id)}
                                        className="mt-3 w-full py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                <SetBounds locations={villages} />
            </MapContainer>

            <Legend />
        </div>
    );
};

export default VillageMap;
