import React, { useState } from 'react';

const ZoneManager = ({ zones, activeZoneId, onZoneAdd, onZoneSelect, onZoneRename, onZoneDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const activeZone = zones.find(z => z.id === activeZoneId);

    const handleStartEdit = () => {
        if (activeZone) {
            setEditName(activeZone.name);
            setIsEditing(true);
        }
    };

    const handleSaveEdit = () => {
        if (activeZone && editName.trim()) {
            onZoneRename(activeZoneId, editName.trim());
            setIsEditing(false);
        }
    };

    return (
        <div className="absolute top-4 left-16 bg-gray-800/90 p-4 rounded shadow-lg z-[1000] w-64 text-white">
            <h3 className="font-bold mb-2 text-blue-400">Safe Zones</h3>

            <div className="flex flex-col gap-3">
                {/* Zone Selector */}
                <select
                    value={activeZoneId || ''}
                    onChange={(e) => onZoneSelect(e.target.value)}
                    className="bg-gray-700 p-2 rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
                >
                    <option value="" disabled>Select a Zone</option>
                    {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                            {zone.name}
                        </option>
                    ))}
                </select>

                {/* Active Zone Actions */}
                {activeZone && (
                    <div className="flex flex-col gap-2 p-2 bg-gray-700/50 rounded">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-gray-600 p-1 rounded text-sm flex-grow min-w-0"
                                    autoFocus
                                />
                                <button onClick={handleSaveEdit} className="text-green-400 text-xs font-bold">OK</button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium truncate">{activeZone.name}</span>
                                <button onClick={handleStartEdit} className="text-xs text-blue-300 hover:text-white">Rename</button>
                            </div>
                        )}

                        <button
                            onClick={() => onZoneDelete(activeZoneId)}
                            className="text-xs text-red-400 hover:text-red-300 text-left mt-1"
                        >
                            Delete Zone
                        </button>
                    </div>
                )}

                {/* Add New Button */}
                <button
                    onClick={onZoneAdd}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded transition-colors font-bold"
                >
                    + Add New Safe Zone
                </button>
            </div>
        </div>
    );
};

export default ZoneManager;
