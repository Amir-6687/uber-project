const axios = require('axios');
const captainModel = require('../models/captain.model');

// ---------- Free APIs (no API key / no credit card) ----------
// Nominatim (OSM) geocoding, Photon (Komoot) autocomplete, OSRM routing

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE = 'https://photon.komoot.io/api';
const OSRM_BASE = 'https://router.project-osrm.org';

module.exports.getAddressCoordinate = async (address) => {
    if (!address || !address.trim()) {
        throw new Error('Address is required');
    }
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'UberVideo/1.0' }
        });
        if (response.data && response.data[0]) {
            const { lat, lon } = response.data[0];
            return {
                ltd: parseFloat(lat),
                lng: parseFloat(lon)
            };
        }
        throw new Error('Unable to fetch coordinates');
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    try {
        const [originCoords, destCoords] = await Promise.all([
            module.exports.getAddressCoordinate(origin),
            module.exports.getAddressCoordinate(destination)
        ]);
        // OSRM expects lon,lat;lon,lat
        const coords = `${originCoords.lng},${originCoords.ltd};${destCoords.lng},${destCoords.ltd}`;
        const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=false`;

        const response = await axios.get(url);
        if (response.data.code === 'Ok' && response.data.routes && response.data.routes[0]) {
            const route = response.data.routes[0];
            return {
                distance: { value: Math.round(route.distance) },
                duration: { value: Math.round(route.duration) }
            };
        }
        throw new Error('No routes found');
    } catch (err) {
        console.error(err);
        throw err;
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input || !input.trim()) {
        return [];
    }

    const url = `${PHOTON_BASE}/?q=${encodeURIComponent(input)}&limit=6`;

    try {
        const response = await axios.get(url);
        if (!response.data || !response.data.features) {
            return [];
        }
        return response.data.features.map((f) => {
            const p = f.properties || {};
            const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
            return parts.length ? parts.join(', ') : (p.display_name || '');
        }).filter(Boolean);
    } catch (err) {
        console.error(err);
        return [];
    }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, ltd], radius / 6371]
            }
        }
    });
    return captains;
};
