import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

export const UserLogout = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token')
        const baseUrl = API_BASE

        axios.get(`${baseUrl}/users/logout`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => {
                if (response.status === 200) {
                    localStorage.removeItem('token')
                    navigate('/login', { replace: true })
                }
            })
            .catch(() => {
                localStorage.removeItem('token')
                navigate('/login', { replace: true })
            })
    }, [ navigate ])

    return <div>Logging out...</div>
}

export default UserLogout
