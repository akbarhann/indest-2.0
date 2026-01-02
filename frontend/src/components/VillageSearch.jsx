import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

const VillageSearch = ({ onSelect, initialVillages = [], placeholder = "Cari Desa..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [villages, setVillages] = useState(initialVillages);
    const wrapperRef = useRef(null);

    // Fetch villages if not provided
    useEffect(() => {
        if (initialVillages.length === 0) {
            const fetchVillages = async () => {
                try {
                    const res = await axios.get('http://localhost:8000/api/macro');
                    setVillages(res.data.data);
                } catch (error) {
                    console.error("Failed to fetch villages for search:", error);
                }
            };
            fetchVillages();
        } else {
            setVillages(initialVillages);
        }
    }, [initialVillages]);

    // Filter logic
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const filtered = villages.filter(v =>
            v.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // Limit to 10 results
        setResults(filtered);
    }, [query, villages]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (village) => {
        setQuery('');
        setIsOpen(false);
        onSelect(village.id);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto z-[3000]">
                    {results.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => handleSelect(v)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors flex flex-col"
                        >
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{v.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Kec. {v.district}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VillageSearch;
