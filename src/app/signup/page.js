"use client"

import { useState } from "react"

export default function SignUpPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="bg-gray-700 p-8 rounded-lg shadow-md w-full max-w-md text-center mb-20">
                <h1 className="text-3xl font-bold mb-10 text-gray-300">Sign Up</h1>
                <div className="flex gap-4">
                    <button 
                        onClick={() => (window.location.href = '/signupCustomer')} 
                        className="w-full bg-gray-500 text-gray-300 py-2 px-4 rounded-md"
                    >
                        Customer
                    </button>
                    <button 
                        onClick={() => (window.location.href = '/signupEmployee')} 
                        className="w-full bg-gray-500 text-gray-300 py-2 px-4 rounded-md"
                    >
                        Employee
                    </button>
                </div>
            </div>
        </div>
    )
}