import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const center = { lat: 52.52, lng: 13.405 };
const LOCATION_ZOOM = 16;

function InitialCenterOnce({ position, defaultCenter }) {
    const map = useMap();
    const done = useRef(false);
    useEffect(() => {
        if (done.current) return;
        if (!position || position.lat === defaultCenter.lat && position.lng === defaultCenter.lng) return;
        done.current = true;
        map.setView([position.lat, position.lng], 15);
    }, [map, position, defaultCenter]);
    return null;
}

function LocateOnTrigger({ locateTrigger, onPositionUpdate }) {
    const map = useMap();
    useEffect(() => {
        if (locateTrigger === 0) return;
        if (!navigator.geolocation) return;
        const onSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            const newPos = { lat: latitude, lng: longitude };
            map.flyTo([latitude, longitude], LOCATION_ZOOM, { duration: 800 });
            onPositionUpdate(newPos);
        };
        const onError = () => {};
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    }, [locateTrigger, map, onPositionUpdate]);
    return null;
}

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const LiveTracking = ({ locateTrigger = 0 }) => {
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
        <div className="w-full h-full min-h-[300px] rounded overflow-hidden relative">
            <MapContainer
                center={position}
                zoom={15}
                className="w-full h-full"
                style={{ minHeight: '300px' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <InitialCenterOnce position={position} defaultCenter={center} />
                <Marker position={position} icon={defaultIcon}>
                    <Popup>You are here</Popup>
                </Marker>
                <LocateOnTrigger locateTrigger={locateTrigger} onPositionUpdate={setPosition} />
            </MapContainer>
        </div>
    );
};

export default LiveTracking;
