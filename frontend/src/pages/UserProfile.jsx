import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'

const UserProfile = () => {
    const { user } = useContext(UserDataContext)
    const name = user?.fullname || user?.fullName
    const first = name?.firstname ?? name?.firstName ?? ''
    const last = name?.lastname ?? name?.lastName ?? ''
    const fullName = [ first, last ].filter(Boolean).join(' ') || '–'
    const email = user?.email ?? '–'

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
                <Link to="/home" className="inline-flex items-center gap-2 text-gray-600 mb-6">
                    <i className="ri-arrow-left-line"></i> Back
                </Link>
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="ri-user-3-line text-3xl text-gray-500"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">{fullName}</h1>
                            <p className="text-gray-500 text-sm">{email}</p>
                        </div>
                    </div>
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
                        className="mt-6 flex items-center justify-between w-full py-3 px-4 bg-gray-50 rounded-xl"
                    >
                        <span className="flex items-center gap-2">
                            <i className="ri-bank-card-line"></i> Payment methods
                        </span>
                        <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default UserProfile
