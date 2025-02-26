import { auth } from "@/auth";
import { getUsersByEmail } from "@/queries/users";
import { getAcceptedBookingsByEmail } from "@/queries/accepted-bookings";
import { CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, UserIcon, BriefcaseIcon, TagIcon } from "lucide-react";

const EmployeeOrders = async () => {
    const session = await auth();
    const loggedInUser = session?.user;

    if (!loggedInUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <div className="mb-4 text-red-400">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="text-red-400 text-xl font-semibold">Sign in to view your dashboard</p>
                    <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    const user = await getUsersByEmail(loggedInUser.email);
    
    if (!user.service) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <div className="mb-4 text-yellow-400">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <p className="text-yellow-400 text-xl font-semibold">You are not registered as a worker.</p>
                    <button className="mt-6 px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
                        Register as Worker
                    </button>
                </div>
            </div>
        );
    }

    // Get bookings for this worker's service
    const bookings = await getAcceptedBookingsByEmail(loggedInUser.email, user.service);

    return (
        <div className="min-h-screen custom-bg_text py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <div className="gap-8">
                    {/* Orders Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 h-full">
                            <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    My Orders
                                </h2>
                                <div className="bg-blue-500 text-slate-100 px-3 py-1 rounded-md text-sm font-medium">
                                    {bookings.length} Orders
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[555px] overflow-y-auto custom-scrollbar">
                                {bookings.length > 0 ? (
                                    <div className="space-y-4">                                
                                        {bookings.map((booking, index) => (
                                            <div key={index} className="bg-gray-700 hover:bg-gray-650 border-l-4 border-gray-400 rounded-lg shadow-md transition-all duration-200 overflow-hidden">
                                                <div className="p-5">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                                                        <h3 className="text-lg font-medium text-white">{booking.customerUsername}</h3> {/* ✅ Updated */}
                                                        <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                                                            {new Date(booking.date).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col gap-3 text-base text-gray-300">
                                                        <div className="flex items-center gap-2">
                                                            <MailIcon className="w-4 h-4 text-blue-400" />
                                                            <span>{booking.customerEmail}</span> {/* ✅ Updated */}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <PhoneIcon className="w-4 h-4 text-blue-400" />
                                                            <span>{booking.customerPhone}</span> {/* ✅ Updated */}
                                                        </div>
                                                        <div className="flex items-start gap-2 col-span-1 sm:col-span-2">
                                                            <MapPinIcon className="w-4 h-4 text-blue-400 mt-0.5" />
                                                            <span>{booking.street}, {booking.city}, {booking.state}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                                            <span className="text-sm text-gray-400">Completed</span>
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
                                        <p className="text-gray-500 mb-6 max-w-md">You don't have any customer orders yet. When customers book your service, their details will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeOrders;