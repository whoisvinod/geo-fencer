import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import ZoneManager from './components/ZoneManager';
import SmartTimer from './components/SmartTimer';
import useGeolocation from './hooks/useGeolocation';

import * as turf from '@turf/turf';

import HistoryScreen from './components/HistoryScreen';

function App() {
  const { location: userLocation, error: locationError } = useGeolocation();
  const [manualLocation, setManualLocation] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);


  // Zone State
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem('geo-fencer-zones');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeZoneId, setActiveZoneId] = useState(null);

  const [status, setStatus] = useState('No Zone Selected');
  const [alert, setAlert] = useState(false);

  const activeLocation = manualLocation || userLocation;
  const activeZone = zones.find(z => z.id === activeZoneId);

  // Persistence
  useEffect(() => {
    localStorage.setItem('geo-fencer-zones', JSON.stringify(zones));
  }, [zones]);

  // Geofencing Logic
  useEffect(() => {
    if (!activeZone?.polygon || !activeLocation) {
      setStatus(activeZone ? 'Draw a Zone' : 'No Zone Selected');
      setAlert(false);
      return;
    }

    // Turf expects [lng, lat]
    const userPoint = turf.point([activeLocation[1], activeLocation[0]]);
    const searchPolygon = turf.polygon([activeZone.polygon]);

    const isInside = turf.booleanPointInPolygon(userPoint, searchPolygon);

    if (isInside) {
      setStatus(`Inside ${activeZone.name}`);
      setAlert(false);
    } else {
      setStatus(`OUTSIDE ${activeZone.name}!`);
      setAlert(true);
    }
  }, [activeLocation, activeZone]);

  // Zone Handlers
  const handleAddZone = () => {
    const newZone = {
      id: crypto.randomUUID(),
      name: `Safe Zone ${zones.length}`,
      polygon: null
    };
    setZones([...zones, newZone]);
    setActiveZoneId(newZone.id);
  };

  const handleUpdateZonePolygon = (polygon) => {
    if (!activeZoneId) return;
    setZones(zones.map(z =>
      z.id === activeZoneId ? { ...z, polygon } : z
    ));
  };

  const handleRenameZone = (id, newName) => {
    setZones(zones.map(z =>
      z.id === id ? { ...z, name: newName } : z
    ));
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
    if (activeZoneId === id) setActiveZoneId(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 shadow-md z-10 flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-blue-400">GeoFencer</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newMode = !isTestMode;
              setIsTestMode(newMode);
              if (!newMode) {
                setManualLocation(null);
              }
            }}
            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${isTestMode ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
          >
            {isTestMode ? 'Test Mode: ON' : 'Test Mode: OFF'}
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1 rounded text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            History
          </button>

          <div className={`px-4 py-2 rounded font-bold transition-all duration-300 ${alert ? 'bg-red-600 animate-pulse' :
            status.startsWith('Inside') ? 'bg-green-600' : 'bg-gray-600'
            }`}>
            {status}
          </div>
        </div>
      </header>

      <main className="flex-grow relative">
        {showHistory && <HistoryScreen onClose={() => setShowHistory(false)} />}

        <ZoneManager
          zones={zones}
          activeZoneId={activeZoneId}
          onZoneAdd={handleAddZone}
          onZoneSelect={setActiveZoneId}
          onZoneRename={handleRenameZone}
          onZoneDelete={handleDeleteZone}
        />

        <MapView
          key={activeZoneId} // Force remount when switching zones to clear/redraw
          onGeofenceChange={handleUpdateZonePolygon}
          userLocation={activeLocation}
          onLocationManualChange={setManualLocation}
          isTestMode={isTestMode}
          initialPolygon={activeZone?.polygon}
        />

        {locationError && (
          <div className="absolute bottom-4 left-4 bg-red-500/90 p-3 rounded text-sm max-w-xs z-[1000]">
            Error: {locationError}
          </div>
        )}

        <div className="absolute bottom-8 right-4 bg-gray-800/90 p-4 rounded shadow-lg z-[1000] max-w-xs flex flex-col gap-4">

          {/* Timer Section */}
          <SmartTimer
            isInside={status.startsWith('Inside')}
            activeZoneName={activeZone?.name}
          />

          <div>
            <h3 className="font-bold mb-2">Instructions</h3>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>1. Create or Select a <b>Safe Zone</b>.</li>
              <li>2. Use the polygon tool (top right) to draw the zone.</li>
              <li>3. Enable <b>Test Mode</b> to click and set your location manually.</li>
              <li>4. If you leave the zone, you will be alerted.</li>
              <li>5. Press <b>'F'</b> to focus map on your location.</li>
            </ul>
          </div>

          {activeLocation && (
            <div className="mt-2 text-xs text-gray-400">
              Lat: {activeLocation[0].toFixed(4)}, Lng: {activeLocation[1].toFixed(4)}
            </div>
          )}
          {activeLocation && (
            <div className="mt-1 text-[10px] text-gray-500 uppercase font-bold">
              Source: {manualLocation ? 'Manual Override' : 'GPS / Browser'}
            </div>
          )}
        </div>

      </main >
    </div >
  );
}

export default App;

