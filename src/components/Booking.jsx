"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignIn from "@/components/SignIn";

const BookingPage = () => {
    const searchParams = useSearchParams();
    const serviceName = searchParams.get("service");

    const [user, setUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/user");
                if (!response.ok) throw new Error("Failed to fetch user");
                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user || !selectedDate) return;

        try {
            const response = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    street: user.street,
                    city: user.city,
                    state: user.state,
                    service: serviceName,
                    date: selectedDate,
                }),
            });

            const data = response.headers.get("content-type")?.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                if (data.message === "No worker available for this service." || data === "No worker available for this service.") {
                    setSuccessMessage("Currently, no worker is available for this service.");
                } else {
                    setError(typeof data === "string" ? data : data.message);
                }
            } else {
                setSuccessMessage("Your booking has been confirmed");
                setTimeout(() => router.push("/"), 3000);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    if (loading) return <p className="text-center text-lg text-gray-300">Loading...</p>;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800 p-6">
            {user ? (
                user.service ? (
                    <h1 className="text-2xl font-semibold text-red-400 text-center">You cannot book a service</h1>
                ) : (
                    <div className="bg-gray-700 shadow-xl rounded-3xl p-8 w-full max-w-lg text-white">
                        <h2 className="text-3xl text-gray-300 font-semibold text-center mb-6">Book Your Service</h2>
                        <h1 className="text-2xl font-semibold text-center text-gray-400">{serviceName || "No service selected"}</h1>
                        {error && <p className="text-red-400 mt-2 text-sm text-center">{error}</p>}
                        {successMessage && (
                            <p className={`mt-2 text-lg text-center ${successMessage.includes("no worker") ? "text-red-400" : "text-green-400"}`}>{successMessage}</p>
                        )}
                        {!successMessage && (
                            <form onSubmit={handleSubmit} className="mt-6">
                                <label htmlFor="date" className="block font-semibold text-gray-300">Select Date:</label>
                                <input
                                    type="date"
                                    id="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="mt-2 px-3 py-2 rounded w-full bg-gray-600 text-gray-300"
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                />
                                <button type="submit" className="mt-10 text-lg bg-gray-500 text-gray-300 px-4 py-2 rounded w-full">
                                    Confirm Booking
                                </button>
                            </form>
                        )}
                    </div>
                )
            ) : (
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-6 text-white">Sign in to book a service</h1>
                    <div className="bg-gray-700 p-8 rounded-2xl shadow-md">
                        <SignIn />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPage;