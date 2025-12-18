import React, { useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';

import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';


// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RecenterAutomatically = ({ location }) => {
    const map = useMap();
    const [initialized, setInitialized] = useState(false);

    React.useEffect(() => {
        if (location && !initialized) {
            map.setView(location, map.getZoom());
            setInitialized(true);
        }
    }, [location, map, initialized]);

    return null;
};

const FocusHandler = ({ userLocation }) => {
    const map = useMapEvents({
        keydown(e) {
            if ((e.originalEvent.key === 'f' || e.originalEvent.key === 'F') && userLocation) {
                map.flyTo(userLocation, map.getZoom());
            }
        }
    });

    // Also add global listener because map might not have focus
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'f' || e.key === 'F') && userLocation) {
                map.flyTo(userLocation, map.getZoom());
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [map, userLocation]);

    return null;
};

const MapEvents = ({ isTestMode, onLocationManualChange }) => {
    useMapEvents({
        click(e) {
            // Only allow manual location set if in Test Mode
            if (isTestMode) {
                onLocationManualChange([e.latlng.lat, e.latlng.lng]);
            }
        },
    });
    return null;
};

const LocateControl = ({ userLocation }) => {
    const map = useMap();

    const handleLocate = (e) => {
        e.preventDefault();
        if (userLocation) {
            map.flyTo(userLocation, 16);
        } else {
            alert("Location not found yet!");
        }
    };

    return (
        <div className="leaflet-top leaflet-left" style={{ marginTop: '80px' }}>
            <div className="leaflet-control leaflet-bar">
                <a
                    href="#"
                    title="Locate Me"
                    role="button"
                    aria-label="Locate Me"
                    onClick={handleLocate}
                    style={{
                        backgroundColor: 'white',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'black',
                        fontSize: '20px',
                        textDecoration: 'none'
                    }}
                >
                    📍
                </a>
            </div>
        </div>
    );
};

const FitBoundsToPolygon = ({ polygon }) => {
    const map = useMap();
    React.useEffect(() => {
        if (polygon && polygon.length > 0) {
            // polygon is [[lng, lat], ...]
            const leafletCoords = polygon.map(coord => [coord[1], coord[0]]);
            const bounds = L.latLngBounds(leafletCoords);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [polygon, map]);
    return null;
};


const MapView = ({ onGeofenceChange, userLocation, onLocationManualChange, isTestMode, initialPolygon, accuracy }) => {
    const featureGroupRef = React.useRef();
    React.useEffect(() => {

        if (initialPolygon && featureGroupRef.current) {
            const group = featureGroupRef.current;
            group.clearLayers();

            const leafletCoords = initialPolygon.map(coord => [coord[1], coord[0]]);
            if (leafletCoords.length > 0 &&
                leafletCoords[0][0] === leafletCoords[leafletCoords.length - 1][0] &&
                leafletCoords[0][1] === leafletCoords[leafletCoords.length - 1][1]) {
                leafletCoords.pop();
            }

            const polygon = L.polygon(leafletCoords);
            polygon.addTo(group);
        } else if (!initialPolygon && featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
        }
    }, [initialPolygon]);

    const _onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const latlngs = layer.getLatLngs()[0];
            const coordinates = latlngs.map(ll => [ll.lng, ll.lat]);
            coordinates.push(coordinates[0]);
            onGeofenceChange(coordinates);
        }
    };

    const _onEdited = (e) => {
        e.layers.eachLayer(layer => {
            if (layer.getLatLngs) {
                const latlngs = layer.getLatLngs()[0];
                const coordinates = latlngs.map(ll => [ll.lng, ll.lat]);
                coordinates.push(coordinates[0]);
                onGeofenceChange(coordinates);
            }
        });
    };

    const _onDeleted = (e) => {
        onGeofenceChange(null);
    };


    return (
        <MapContainer
            center={userLocation || [51.505, -0.09]}
            zoom={13}
            maxZoom={22}
            style={{ height: '100%', width: '100%' }}
        >

            <MapEvents isTestMode={isTestMode} onLocationManualChange={onLocationManualChange} />
            <FocusHandler userLocation={userLocation} />
            <RecenterAutomatically location={userLocation} />
            <FitBoundsToPolygon polygon={initialPolygon} />
            <LocateControl userLocation={userLocation} />



            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={22}
            />

            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={_onCreated}
                    onEdited={_onEdited}
                    onDeleted={_onDeleted}
                    draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: true,
                    }}
                />
            </FeatureGroup>
            {userLocation && (
                <>
                    <Marker position={userLocation} />
                    {accuracy && (
                        <Circle
                            center={userLocation}
                            radius={accuracy}
                            pathOptions={{
                                fillColor: '#3b82f6',
                                fillOpacity: 0.1,
                                color: '#3b82f6',
                                weight: 1
                            }}
                        />
                    )}
                </>
            )}

        </MapContainer>
    );
};



export default MapView;
