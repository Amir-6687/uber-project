import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';
import UserMenu from '../components/UserMenu';
import { API_BASE } from '../config';

const Home = () => {
    const [ locateTrigger, setLocateTrigger ] = useState(0)
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ apiError, setApiError ] = useState('')

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        if (user?._id) {
            socket.emit("join", { userType: "user", userId: user._id })
        }
    }, [ user, socket ])

    useEffect(() => {
        const onRideConfirmed = (ride) => {
            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(ride)
        }
        const onRideStarted = (ride) => {
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride } })
        }
        socket.on('ride-confirmed', onRideConfirmed)
        socket.on('ride-started', onRideStarted)
        return () => {
            socket.off('ride-confirmed', onRideConfirmed)
            socket.off('ride-started', onRideStarted)
        }
    }, [ socket, navigate ])


    const handlePickupChange = async (e) => {
        const value = e.target.value
        setPickup(value)
        if (value.trim().length < 3) {
            setPickupSuggestions([])
            return
        }
        try {
            const response = await axios.get(`${API_BASE}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setPickupSuggestions(response.data)
        } catch {
            setPickupSuggestions([])
        }
    }

    const handleDestinationChange = async (e) => {
        const value = e.target.value
        setDestination(value)
        if (value.trim().length < 3) {
            setDestinationSuggestions([])
            return
        }
        try {
            const response = await axios.get(`${API_BASE}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setDestinationSuggestions(response.data)
        } catch {
            setDestinationSuggestions([])
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])


    async function findTrip() {
        setApiError('')
        const pick = (pickup || '').trim()
        const dest = (destination || '').trim()
        if (pick.length < 3 || dest.length < 3) {
            setApiError('Please enter both pickup and destination (at least 3 characters each).')
            return
        }
        setVehiclePanel(true)
        setPanelOpen(false)
        try {
            const response = await axios.get(`${API_BASE}/rides/get-fare`, {
                params: { pickup: pick, destination: dest },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setFare(response.data)
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Could not get fare. Please try again.'
            setApiError(msg)
        }
    }

    async function createRide() {
        setApiError('')
        try {
            await axios.post(`${API_BASE}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Could not create ride. Please try again.'
            setApiError(msg)
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5 z-10' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
            <UserMenu />
            <div className='h-screen w-screen relative z-0'>
                <LiveTracking locateTrigger={locateTrigger} />
            </div>
            <button
                type="button"
                onClick={() => setLocateTrigger((t) => t + 1)}
                className="absolute bottom-[300px] right-5 z-20 h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95"
                aria-label="Center on my location"
            >
                <i className="ri-focus-3-line text-2xl text-gray-700"></i>
            </button>
            <div className='flex flex-col justify-end h-screen absolute inset-0 w-full z-10 pointer-events-none'>
                <div className='relative pointer-events-auto rounded-t-3xl min-h-[300px] bg-white/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.12)] border-t border-gray-100'>
                    <div className='absolute left-1/2 -translate-x-1/2 top-3 w-12 h-1 rounded-full bg-gray-200' />
                    <h5 ref={panelCloseRef} onClick={() => setPanelOpen(false)} className='absolute right-5 top-5 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors'>
                        <i className='ri-arrow-down-s-line text-xl' />
                    </h5>
                    <div className='px-5 pt-6 pb-8'>
                        <h4 className='text-xl font-bold text-gray-900 tracking-tight mb-5'>Where to?</h4>
                        <form className='space-y-0' onSubmit={(e) => submitHandler(e)}>
                            <div className='rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden shadow-sm'>
                                <label className='flex items-center gap-3 px-4 py-3.5 border-b border-gray-100'>
                                    <span className='flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white'>
                                        <i className='ri-circle-fill text-[8px]' />
                                    </span>
                                    <input
                                        onClick={() => { setPanelOpen(true); setActiveField('pickup') }}
                                        value={pickup}
                                        onChange={handlePickupChange}
                                        className='flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 text-[15px] font-medium outline-none'
                                        type='text'
                                        placeholder='Add pick-up location'
                                    />
                                </label>
                                <label className='flex items-center gap-3 px-4 py-3.5'>
                                    <span className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white'>
                                        <i className='ri-map-pin-2-fill text-sm' />
                                    </span>
                                    <input
                                        onClick={() => { setPanelOpen(true); setActiveField('destination') }}
                                        value={destination}
                                        onChange={handleDestinationChange}
                                        className='flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 text-[15px] font-medium outline-none'
                                        type='text'
                                        placeholder='Where to?'
                                    />
                                </label>
                            </div>
                            {apiError && <p className='text-red-500 text-sm mt-3 font-medium'>{apiError}</p>}
                            <button
                                type='button'
                                onClick={findTrip}
                                className='mt-5 w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-base shadow-lg shadow-gray-900/20 hover:bg-gray-800 active:scale-[0.98] transition-all duration-200'
                            >
                                Find Trip
                            </button>
                        </form>
                    </div>
                </div>
                <div ref={panelRef} className='bg-white h-0 overflow-hidden pointer-events-auto'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}

                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full  z-10 bottom-0  bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
        </div>
    )
}

export default Home