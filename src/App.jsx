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

  const activeLocation = manualLocation ? { lat: manualLocation[0], lng: manualLocation[1], accuracy: 0 } : userLocation;
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
    const userPoint = turf.point([activeLocation.lng, activeLocation.lat]);
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
      <header className="p-4 bg-gray-800 shadow-md z-10 flex flex-col md:flex-row justify-between items-center gap-4">

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

      <main className="flex-grow flex flex-col md:block relative overflow-y-auto md:overflow-hidden">
        {showHistory && <HistoryScreen onClose={() => setShowHistory(false)} />}

        {/* Zone Manager: Relative on Mobile, Absolute on Desktop */}
        <div className="relative z-20 md:absolute md:top-0 md:left-0 md:w-full md:h-0 p-4 md:p-0">
          <ZoneManager
            zones={zones}
            activeZoneId={activeZoneId}
            onZoneAdd={handleAddZone}
            onZoneSelect={setActiveZoneId}
            onZoneRename={handleRenameZone}
            onZoneDelete={handleDeleteZone}
          />
        </div>


        {/* Map: Fixed height on Mobile (to ensure visibility), Full height on Desktop */}
        <div className="w-full h-[400px] md:h-full relative z-10 flex-shrink-0">
          <MapView
            key={activeZoneId}
            onGeofenceChange={handleUpdateZonePolygon}
            userLocation={activeLocation ? [activeLocation.lat, activeLocation.lng] : null}
            onLocationManualChange={setManualLocation}
            isTestMode={isTestMode}
            initialPolygon={activeZone?.polygon}
            accuracy={activeLocation?.accuracy}
          />

        </div>

        {/* Error Message */}
        {locationError && (
          <div className="relative md:absolute bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto bg-red-500/90 p-3 text-sm md:max-w-xs z-[1000] text-center md:text-left md:rounded">
            Error: {locationError}
          </div>
        )}

        {/* Timer/Instructions: Relative on Mobile, Absolute on Desktop */}
        <div className="relative z-20 bg-gray-800 p-4 md:absolute md:bottom-8 md:right-4 md:bg-gray-800/90 md:rounded md:shadow-lg md:max-w-xs flex flex-col gap-4">

          {/* Timer Section */}
          <SmartTimer
            isInside={status.startsWith('Inside')}
            activeZoneName={activeZone?.name}
          />

          <div className="block"> {/* Show instructions on mobile */}
            <h3 className="font-bold mb-2">Instructions</h3>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>1. Create or Select a <b>Safe Zone</b>.</li>
              <li>2. Use the polygon tool (top right) to draw the zone.</li>
              <li>3. Enable <b>Test Mode</b> to click and set your location manually.</li>
              <li>4. If you leave the zone, you will be alerted.</li>
              <li>5. Press <b>'F'</b> to focus map on your location.</li>
            </ul>
          </div>


          {activeLocation && typeof activeLocation.lat === 'number' && (
            <div className="mt-2 text-xs text-gray-400">
              Lat: {activeLocation.lat.toFixed(4)}, Lng: {activeLocation.lng?.toFixed(4)}
              <br />
              <span className={(activeLocation.accuracy || 0) > 50 ? "text-red-400" : "text-green-400"}>
                Accuracy: +/- {Math.round(activeLocation.accuracy || 0)}m
              </span>
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

