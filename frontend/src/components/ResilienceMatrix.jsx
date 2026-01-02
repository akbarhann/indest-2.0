import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const ResilienceMatrix = ({ villages }) => {
    // We need to map village data to scatter points.
    // X: Frequency (simplified as sum of cases for now in API we only sent 'flood' count, let's use that)
    // Y: Mitigation (simplified as 'warning_system' presence? If 'Ada' -> High, else Low)

    // Since API gave simplistic disaster_risk, we improvise logic for demo:
    // X = Flood Cases (0-10+)
    // Y = Randomized 'Readiness Score' based on warning system string length or presence for visuals
    // Ideally backend ScoringAlgorithm provides this.

    const dataPoints = villages.map(v => {
        const flood = v.disaster_risk.flood;
        const hasWarning = v.disaster_risk.warning_system && v.disaster_risk.warning_system.toLowerCase().includes('ada');

        // Mocking readiness: 80-100 if warning system, 10-40 if not
        const readiness = hasWarning ? (80 + Math.random() * 20) : (10 + Math.random() * 30);

        // Color based on Quadrant
        // Resilient: High Risk (Flood > 2) & High Readiness (>50) -> Yellow
        // Danger: High Risk (>2) & Low Readiness (<50) -> Red
        // Safe: Low Risk (<2) -> Green

        let color = '#10B981'; // Green (Safe)
        if (flood > 0) { // Risk present
            if (readiness < 60) color = '#EF4444'; // Red (Danger)
            else color = '#F59E0B'; // Yellow (Resilient/Mitigated)
        }

        return {
            x: flood,
            y: readiness,
            name: v.name,
            riskStatus: color === '#EF4444' ? 'Danger' : (color === '#F59E0B' ? 'Resilient' : 'Safe'),
            backgroundColor: color
        };
    });

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Disaster Frequency (Flood Events)' },
                beginAtZero: true,
                max: 10 // Cap for visual
            },
            y: {
                title: { display: true, text: 'Mitigation Readiness Score' },
                beginAtZero: true,
                max: 100
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const pt = context.raw;
                        return `${pt.name}: ${pt.riskStatus} (Freq: ${pt.x}, Ready: ${pt.y.toFixed(0)})`;
                    }
                }
            },
            legend: {
                display: false // Dots are colored individually
            }
        }
    };

    const data = {
        datasets: [
            {
                label: 'Villages',
                data: dataPoints,
                backgroundColor: dataPoints.map(d => d.backgroundColor),
                pointRadius: 6,
                pointHoverRadius: 8
            },
        ],
    };

    return (
        <div className="h-full w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                Disaster Resilience Matrix
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Scatter Plot</span>
            </h3>
            <div className="h-64 md:h-80">
                <Scatter options={options} data={data} />
            </div>
        </div>
    );
};

export default ResilienceMatrix;
