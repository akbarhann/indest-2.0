import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import clsx from 'clsx';

const TeamPage = () => {
    const [stage, setStage] = useState(0); // 0: Hidden, 1: Centered Show, 2: Final Position

    useEffect(() => {
        // Stage 0 -> 1 (Fade In Center)
        const t1 = setTimeout(() => setStage(1), 100);
        // Stage 1 -> 2 (Move to Corner)
        const t2 = setTimeout(() => setStage(2), 2500); // 2.5s display time

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const team = [
        { name: "Moch. Akbar Hanafi", role: "Pengembang Backend dan Frontend", image: "/team/akbar.jpg" },
        { name: "Erma Shafira Zulfianti", role: "Pengembang Frontend & UI/UX", image: "/team/erma.jpg" },
        { name: "Zulma Nayla Ifaada", role: "Pengembang Frontend & UI/UX", image: "/team/zulma.jpg" },
        { name: "Ummul Khoirro’ Syari", role: "Pengembang Frontend & UI/UX", image: "/team/ummul.jpg" }
    ];

    return (
        <div className="p-6 h-full overflow-y-auto bg-brand-light dark:bg-slate-900 relative">
            {/* Backdrop Overlay (Fades out) */}
            <div
                className={clsx(
                    "fixed inset-0 bg-brand-light/90 dark:bg-slate-900/90 backdrop-blur-sm transition-opacity duration-1000 z-40 pointer-events-none",
                    stage === 1 ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Animated Title - Uses Absolute Positioning for smooth transition */}
            <div
                className={clsx(
                    "transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50 absolute",
                    stage < 2
                        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-125"
                        : "top-6 left-6 translate-x-0 translate-y-0 scale-100"
                )}
            >
                <h1 className={clsx(
                    "font-bold text-gray-800 dark:text-white transition-all duration-1000",
                    stage === 1 ? "text-5xl drop-shadow-2xl text-blue-600 dark:text-blue-400" : "text-3xl"
                )}>
                    Meet Our Team
                </h1>
            </div>

            {/* Content (Hidden during intro, slides up) */}
            <div className={clsx(
                "transition-all duration-1000 transform mt-24", // mt-24 reserves space for the absolute header
                stage < 2 ? "opacity-0 translate-y-20" : "opacity-100 translate-y-0"
            )}>
                {/* Description */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-10 max-w-4xl mx-auto text-center">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                        Kami adalah mahasiswa Program Studi Sains Data Universitas Negeri Surabaya yang memperoleh kesempatan mengikuti program magang di Badan Pusat Statistik (BPS) Kabupaten Lamongan. Pengembangan website ini merupakan bentuk kontribusi dan pengabdian kami sebagai mahasiswa dalam membantu penyediaan informasi yang akurat dan mudah diakses bagi masyarakat serta pemangku kepentingan.
                    </p>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {team.map((member, idx) => (
                        <div
                            key={idx}
                            style={{ transitionDelay: `${idx * 100}ms` }} // Staggered entry
                            className={clsx(
                                "bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-md transition-all duration-500 group",
                                stage === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            )}
                        >
                            <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full mb-4 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors relative overflow-hidden">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover rounded-full z-20 relative"
                                    onError={(e) => {
                                        e.target.style.display = 'none'; // Hide img
                                        e.target.nextSibling.style.display = 'flex'; // Show fallback
                                    }}
                                />
                                {/* Fallback Icon (Hidden by default if img load succeeds, but logic is tricky here.
                                    Better approach: Use state or pure CSS. Let's use CSS:
                                    If img hides, we need a way to show the icon.
                                    Actually simpler: Place icon BEHIND image. If image loads, it covers icon. If image fails/missing, we remove image DOM or it's transparent?
                                    onError sets display:none on IMG.
                                    So just put Icon in the container absolutely or just as sibling?
                                    Let's put Icon as absolute center.
                                */}
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <User size={40} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-800 opacity-0 group-hover:opacity-20 transition-opacity rounded-full scale-0 group-hover:scale-100 duration-300 z-30" />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
