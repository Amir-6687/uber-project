import React, { useContext, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'
import { API_BASE } from '../config'

const UserProfile = () => {
    const { user, setUser } = useContext(UserDataContext)
    const navigate = useNavigate()
    const name = user?.fullname || user?.fullName
    const first = name?.firstname ?? name?.firstName ?? ''
    const last = name?.lastname ?? name?.lastName ?? ''
    const fullName = [ first, last ].filter(Boolean).join(' ') || '–'
    const email = user?.email ?? '–'

    const [ editing, setEditing ] = useState(false)
    const [ firstName, setFirstName ] = useState(first)
    const [ lastName, setLastName ] = useState(last)
    const [ editEmail, setEditEmail ] = useState(email)

    useEffect(() => {
        const n = user?.fullname || user?.fullName
        setFirstName(n?.firstname ?? n?.firstName ?? '')
        setLastName(n?.lastname ?? n?.lastName ?? '')
        setEditEmail(user?.email ?? '')
    }, [ user ])
    const [ profileError, setProfileError ] = useState('')
    const [ profileSuccess, setProfileSuccess ] = useState('')

    const [ currentPassword, setCurrentPassword ] = useState('')
    const [ newPassword, setNewPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ passwordError, setPasswordError ] = useState('')
    const [ passwordSuccess, setPasswordSuccess ] = useState('')

    const [ deletePassword, setDeletePassword ] = useState('')
    const [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false)
    const [ deleteError, setDeleteError ] = useState('')

    const token = localStorage.getItem('token')

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setProfileError('')
        setProfileSuccess('')
        if (newPassword && newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }
        try {
            const res = await axios.patch(
                `${API_BASE}/users/profile`,
                {
                    fullname: { firstname: firstName, lastname: lastName },
                    email: editEmail
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setUser(res.data)
            setEditing(false)
            setProfileSuccess('Profile updated.')
        } catch (err) {
            setProfileError(err.response?.data?.message || err.message || 'Update failed.')
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }
        try {
            await axios.patch(
                `${API_BASE}/users/password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setPasswordSuccess('Password updated.')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.')
        }
    }

    const handleDeleteAccount = async (e) => {
        e.preventDefault()
        setDeleteError('')
        try {
            await axios.delete(`${API_BASE}/users/profile`, {
                data: { password: deletePassword },
                headers: { Authorization: `Bearer ${token}` }
            })
            localStorage.removeItem('token')
            setUser({ email: '', fullName: { firstName: '', lastName: '' } })
            navigate('/login', { replace: true })
        } catch (err) {
            setDeleteError(err.response?.data?.message || err.message || 'Could not delete account.')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
                <Link to="/home" className="inline-flex items-center gap-2 text-gray-600 mb-6">
                    <i className="ri-arrow-left-line"></i> Back
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center">
                                <i className="ri-user-3-line text-2xl text-gray-500"></i>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">{fullName}</h1>
                                <p className="text-gray-500 text-sm">{email}</p>
                            </div>
                        </div>
                        {!editing ? (
                            <button type="button" onClick={() => setEditing(true)} className="text-sm text-blue-600 font-medium">
                                Edit
                            </button>
                        ) : (
                            <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">
                                Cancel
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-3">
                            {profileError && <p className="text-red-600 text-sm">{profileError}</p>}
                            {profileSuccess && <p className="text-green-600 text-sm">{profileSuccess}</p>}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">First name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                                    minLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Last name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                                    minLength={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-medium">
                                Save changes
                            </button>
                        </form>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-medium">{fullName}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium">{email}</span>
                                </div>
                            </div>
                            <Link
                                to="/user/payment"
                                className="mt-4 flex items-center justify-between w-full py-3 px-4 bg-gray-50 rounded-xl"
                            >
                                <span className="flex items-center gap-2">
                                    <i className="ri-bank-card-line"></i> Payment methods
                                </span>
                                <i className="ri-arrow-right-s-line text-gray-400"></i>
                            </Link>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h3 className="font-semibold mb-3">Change password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
                        <input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                            required
                        />
                        <input
                            type="password"
                            placeholder="New password (min 6 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                            minLength={6}
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                            minLength={6}
                        />
                        <button type="submit" className="w-full bg-gray-800 text-white py-2 rounded-lg font-medium">
                            Update password
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-red-600 mb-3">Delete account</h3>
                    <p className="text-sm text-gray-500 mb-3">This cannot be undone. All your data will be removed.</p>
                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full border border-red-500 text-red-600 py-2 rounded-lg font-medium"
                        >
                            Delete my account
                        </button>
                    ) : (
                        <form onSubmit={handleDeleteAccount} className="space-y-3">
                            {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
                            <input
                                type="password"
                                placeholder="Enter your password to confirm"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full bg-gray-50 rounded-lg px-3 py-2 border"
                                required
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                                    className="flex-1 py-2 rounded-lg border border-gray-300"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium">
                                    Delete
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserProfile
