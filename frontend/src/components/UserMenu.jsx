import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const UserMenu = () => {
    const [ open, setOpen ] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
                className="absolute right-5 top-5 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md z-20"
                aria-label="Menu"
            >
                <i className="text-xl ri-user-3-line"></i>
            </button>

            {open && (
                <div className="absolute right-5 top-16 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30">
                    <Link
                        to="/user/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                        <i className="ri-user-line text-gray-600"></i>
                        <span>My account</span>
                    </Link>
                    <Link
                        to="/user/payment"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                        <i className="ri-bank-card-line text-gray-600"></i>
                        <span>Payment</span>
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <Link
                        to="/user/logout"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                    >
                        <i className="ri-logout-box-r-line"></i>
                        <span>Log out</span>
                    </Link>
                </div>
            )}
        </div>
    )
}

export default UserMenu
