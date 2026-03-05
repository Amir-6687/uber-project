import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const center = { lat: 52.52, lng: 13.405 };

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);
    return null;
}

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const LiveTracking = () => {
    const [position, setPosition] = useState(center);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const updatePosition = (pos) => {
            setPosition({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            });
        };

        navigator.geolocation.getCurrentPosition(updatePosition);
        const watchId = navigator.geolocation.watchPosition(updatePosition);
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div className="w-full h-full min-h-[300px] rounded overflow-hidden">
            <MapContainer
                center={position}
                zoom={15}
                className="w-full h-full"
                style={{ minHeight: '300px' }}
                scrollWheelZoom
            >
                <ChangeView center={position} zoom={15} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} icon={defaultIcon}>
                    <Popup>You are here</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default LiveTracking;
