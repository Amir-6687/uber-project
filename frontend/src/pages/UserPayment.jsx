import React from 'react'
import { Link } from 'react-router-dom'

const UserPayment = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
                <Link to="/user/profile" className="inline-flex items-center gap-2 text-gray-600 mb-6">
                    <i className="ri-arrow-left-line"></i> Back
                </Link>
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-2">Payment</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Add a payment method for faster checkout.
                    </p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
                        <i className="ri-bank-card-line text-4xl mb-2 block"></i>
                        <p className="text-sm">Online payment coming soon.</p>
                        <p className="text-xs mt-1">You can pay with cash for now.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserPayment
