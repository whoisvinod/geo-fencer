import React, { useState, useEffect } from 'react';

const HistoryScreen = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [filters, setFilters] = useState({
        day: '',
        month: '',
        year: '',
        zone: ''
    });

    useEffect(() => {
        fetch('http://localhost:3000/api/history')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setHistory(data.data);
                    setFilteredHistory(data.data);
                }
            })
            .catch(err => console.error("Failed to fetch history", err));
    }, []);

    useEffect(() => {
        let result = history;

        if (filters.zone) {
            result = result.filter(item => item.zoneName.includes(filters.zone));
        }

        if (filters.day || filters.month || filters.year) {
            result = result.filter(item => {
                // item.date is DD/MM/YYYY
                const [d, m, y] = item.date.split('/');

                if (filters.day && d !== filters.day) return false;
                if (filters.month && m !== filters.month) return false;
                if (filters.year && y !== filters.year) return false;

                return true;
            });
        }

        setFilteredHistory(result);
    }, [filters, history]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-8">
            <div className="bg-gray-800 w-full max-w-4xl h-full max-h-[80vh] rounded-lg shadow-2xl flex flex-col text-white">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-blue-400">Session History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-gray-700/50 flex gap-4 flex-wrap">
                    <input
                        placeholder="Filter by Zone"
                        className="bg-gray-600 p-2 rounded text-sm"
                        value={filters.zone}
                        onChange={e => setFilters({ ...filters, zone: e.target.value })}
                    />
                    <input
                        placeholder="DD"
                        className="bg-gray-600 p-2 rounded text-sm w-16"
                        value={filters.day}
                        onChange={e => setFilters({ ...filters, day: e.target.value })}
                    />
                    <input
                        placeholder="MM"
                        className="bg-gray-600 p-2 rounded text-sm w-16"
                        value={filters.month}
                        onChange={e => setFilters({ ...filters, month: e.target.value })}
                    />
                    <input
                        placeholder="YYYY"
                        className="bg-gray-600 p-2 rounded text-sm w-20"
                        value={filters.year}
                        onChange={e => setFilters({ ...filters, year: e.target.value })}
                    />
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto p-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-600">
                                <th className="p-3">Date</th>
                                <th className="p-3">Zone</th>
                                <th className="p-3">Start Time</th>
                                <th className="p-3">End Time</th>
                                <th className="p-3">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map(item => (
                                <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3">{item.date}</td>
                                    <td className="p-3 font-bold text-blue-300">{item.zoneName}</td>
                                    <td className="p-3 text-sm text-gray-300">{new Date(item.startTime).toLocaleTimeString()}</td>
                                    <td className="p-3 text-sm text-gray-300">{new Date(item.endTime).toLocaleTimeString()}</td>
                                    <td className="p-3 font-mono text-green-400">{formatTime(item.duration)}</td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryScreen;
