import React, { useState } from 'react';
import { Menu, X, Map, BarChart2, Home, Activity, Moon, Sun, Users, Info } from 'lucide-react';
import clsx from 'clsx'; // Optional, using template literals if not installed, but usually good.

const Layout = ({ children, setView, theme, setTheme, locationStatus, onRetryLocation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('macro');

    const toggleSidebar = () => setIsOpen(!isOpen);
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleNav = (view) => {
        setActiveTab(view);
        setView(view);
        setIsOpen(false);
    };

    return (
        <div className="flex h-screen bg-brand-light dark:bg-brand-dark font-sans text-brand-dark dark:text-white overflow-hidden">
            {/* Sidebar Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9990] bg-black/50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-[9999] w-64 bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-risk-med" />
                        <span className="text-blue-600 dark:text-blue-400">Indest</span>
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={toggleSidebar} className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => handleNav('macro')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'macro'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Map size={20} />
                        Peta Wilayah
                    </button>

                    {/* Micro View is typically accessed via map click, but we add a nav item for demo/default */}
                    <button
                        onClick={() => handleNav('micro')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'micro'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Home size={20} />
                        Detail Desa
                    </button>

                    <button
                        onClick={() => handleNav('team')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'team'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Users size={20} />
                        <span>Tim Kami</span>
                    </button>

                    <button
                        onClick={() => handleNav('about')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'about'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Info size={20} />
                        <span>Tentang Website</span>
                    </button>

                    <div className="pt-8 px-4 space-y-4">
                        <div className="bg-gradient-to-br from-risk-med/10 to-risk-high/10 p-4 rounded-xl border border-risk-med/20">
                            <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">System Status</h3>
                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Online & Terpantau
                            </div>
                        </div>

                        {/* Integrated Location Control */}
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-[10px]">Lokasi Anda</h3>
                                <button
                                    onClick={onRetryLocation}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Ulangi Deteksi Lokasi"
                                >
                                    <Activity size={14} className={locationStatus?.status === 'locating' ? 'animate-spin text-blue-500' : 'text-gray-400'} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {locationStatus?.coords ? `${locationStatus.coords.lat}, ${locationStatus.coords.lng}` : 'Tidak Terdeteksi'}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                    {locationStatus?.message || 'Siap mendeteksi...'}
                                </p>
                                {locationStatus?.accuracy && (
                                    <div className="mt-2" title={`Akurasi GPS: ${locationStatus.accuracy} meter`}>
                                        <div className="flex justify-between text-[8px] text-gray-400 mb-0.5">
                                            <span>GPS Signal</span>
                                            <span>{locationStatus.accuracy}m</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full transition-all duration-500 rounded-full",
                                                    locationStatus.accuracy <= 20 ? "bg-green-500 w-full" :
                                                        locationStatus.accuracy <= 100 ? "bg-emerald-400 w-3/4" :
                                                            locationStatus.accuracy <= 500 ? "bg-yellow-400 w-1/2" :
                                                                "bg-red-500 w-1/4"
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
                    <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg hover:bg-gray-50">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-gray-700">
                        {activeTab === 'macro' ? 'Regional Overview' : 'Village Profile'}
                    </span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
