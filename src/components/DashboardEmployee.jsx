"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, UserIcon, BriefcaseIcon, TagIcon } from "lucide-react";

const DashboardEmployee = ({ user, bookings: initialBookings }) => {
    const router = useRouter();
    const [bookings, setBookings] = useState(initialBookings || []); // Store bookings in state
    const [error, setError] = useState("");

    async function handleBookingAction(event, booking, action) {
        event.preventDefault();
        try {
            if (action === "accept") {
                const response = await fetch('/api/accepted-booking', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        employeeUsername: user.username,
                        employeeEmail: user.email,
                        employeePhone: user.phone,
                        customerUsername: booking.username, 
                        customerEmail: booking.email, 
                        customerPhone: booking.phone,
                        street: booking.street,
                        city: booking.city,
                        state: booking.state,
                        category: user.category, 
                        service: user.service,
                        date: booking.date
                    }),
                });

                if (response.status !== 201) {
                    const data = await response.json();
                    setError(data.error || "Failed to accept booking.");
                    return;
                }
            }

            // Remove the accepted or declined booking from state
            setBookings(prevBookings => prevBookings.filter(b => b._id !== booking._id));
        } catch (error) {
            setError("Something went wrong. Please try again.");
        }
    }

    async function handleDecline(event, booking) {
        event.preventDefault();
        try {
            const response = await fetch('/api/reject-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: booking.username,
                    service: user.service,
                    date: booking.date
                }),
            });
    
            if (response.status === 200) {
                // ✅ Remove the booking from UI without refresh
                setBookings((prevBookings) => 
                    prevBookings.filter(b => !(b.username === booking.username && b.service === user.service && b.date === booking.date))
                );
            } else {
                const data = await response.json();
                setError(data.message || "Failed to decline booking.");
            }
        } catch (error) {
            setError("Something went wrong. Please try again.");
        }
    }
    

    return (
        <div className="min-h-screen custom-bg_text py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="col-span-1">
                        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
                            <div className=" bg-gray-700 px-6 py-4">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    Profile
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex flex-col items-center pb-6 border-b border-gray-700">
                                    <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-blue-400">
                                        <UserIcon className="w-11 h-11" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                                    <p className="text-gray-400">Service Provider</p>
                                </div>

                                <ul className="space-y-4 text-gray-300">
                                    <li className="flex items-center gap-3">
                                        <MailIcon className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p>{user.email}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <PhoneIcon className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p>{user.phone}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <TagIcon className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Category</p>
                                            <p>{user.category}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <BriefcaseIcon className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Service</p>
                                            <p>{user.service}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Orders Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 h-full">
                            <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    Available Orders
                                </h2>
                                <div className="bg-blue-500 text-slate-100 px-3 py-1 rounded-md text-sm font-medium">
                                    {bookings.length} Orders
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[486px] overflow-y-auto custom-scrollbar">
                                {bookings.length > 0 ? (
                                    <div className="space-y-4">                                
                                        {bookings.map((booking, index) => (
                                            <div key={index} className="bg-gray-700 hover:bg-gray-650 border-l-4 border-gray-400 rounded-lg shadow-md transition-all duration-200 overflow-hidden">
                                                <div className="p-5">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                                                        <h3 className="text-lg font-medium text-white">{booking.username}</h3>
                                                        <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                                                            {new Date(booking.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                                                        <div className="flex items-center gap-2">
                                                            <MailIcon className="w-4 h-4 text-gray-400" />
                                                            <span>{booking.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                            <span>{booking.phone}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2 col-span-1 sm:col-span-2">
                                                            <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                                            <span>{booking.street}, {booking.city}, {booking.state}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                            <span className="text-sm text-gray-400">Pending</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={(event) => handleBookingAction(event, booking, "accept")}
                                                                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                                                Accept
                                                            </button>

                                                            <button 
                                                                onClick={(event) => handleDecline(event, booking, "decline")}
                                                                className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors">
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-20 h-20 mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                                            <CalendarIcon className="w-10 h-10 text-gray-500" />
                                        </div>
                                        <h3 className="text-xl font-medium text-gray-300 mb-2">No Orders Yet</h3>
                                        <p className="text-gray-500 mb-6 max-w-md">No orders have been made by customers yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="mt-8 col-span-1 md:col-span-3 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden w-full">
                        <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
                            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                            {[
                                { label: "My Orders", link: "/profile_em/my-orders" },
                                { label: "Create One", link: "/profile_em/def" },
                                { label: "Create One", link: "/profile_em/ghi" },
                                { label: "Create One", link: "/profile_em/jkl" },
                            ].map((action, index) => (
                                <Link key={index} href={action.link} className="group">
                                    <div className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 p-4 rounded-lg shadow-md border border-gray-600">
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                        <span className="mt-3 text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                                            {action.label}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardEmployee;


