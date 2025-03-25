'use client'

import { UserIcon } from 'lucide-react';
import { TagIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SignUpEmployee = () => {
    const router = useRouter();
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const serviceCategories = {
        "BeautyAndWellness": [
            "Beautician",
            "Barber",
            "MassageTherapist",
            "FitnessTrainer",
            "YogaTrainer",
            "SpaTherapist",
        ],
        "HomeServices": [
            "Carpenter",
            "Electrician",
            "Plumber",
            "ACTechnician",
            "HomeCleaner",
            "PestControlExpert",
            "ApplianceRepairTechnician",
            "Painter",
            "PlumbingExpert"
        ],
        "DomesticHelp": [
            "HousekeepingStaff",
            "MaidService",
            "Babysitter",
            "GardeningService",
            "LaundryService"
        ],
        "ProfessionalServices": [
            "InteriorDesigner",
            "Photographer",
            "EventPlanner",
            "SecurityGuard",
            "Driver"
        ]
    };
    
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedService, setSelectedService] = useState("");
    
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
        setSelectedService("");
    };
    
    const handleServiceChange = (event) => {
        setSelectedService(event.target.value);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    
    async function submitForm(event) {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);

            const username = formData.get('username');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const password = formData.get('password');
            const category = formData.get('category');
            const service = formData.get('service');

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    username, 
                    email, 
                    phone, 
                    password,
                    category, 
                    service
                }),
            });

            if(response.status !== 201){
                setError(response.error.message);
            }
            else{
                response.status === 201 && router.push('/signin');       
            }
        } catch (error) {
            setError("User already exists");
        }
    };
    
    return (
        <div className="min-h-screen custom-bg_text py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-700 rounded-xl overflow-hidden ">
                <div className="px-6 py-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-medium text-white">Create your account</h2>
                        <p className="mt-2 text-sm text-gray-400">Join our platform and offer your professional services</p>
                    </div>

                    <div className="mb-6 text-center">
                        <div className="mb-4 flex items-center justify-center text-3xl font-bold text-blue-500">
                            <UserIcon className="w-11 h-11" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Employee Information</h3>
                    </div>
                    <form id="signupForm" onSubmit={submitForm} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
                            <div className="mt-1">
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    placeholder="Enter Username" 
                                    required 
                                    className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                            <div className="mt-1">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="name@example.com" 
                                    required 
                                    className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number</label>
                            <div className="mt-1">
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    placeholder="Enter Phone Number" 
                                    required 
                                    className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                            <div className="mt-1 relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="password" 
                                    name="password" 
                                    placeholder="Create a strong password" 
                                    required 
                                    className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                />
                                <button 
                                    type="button" 
                                    onClick={togglePasswordVisibility} 
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <div className="pt-2 gap-4">
                            <li className="flex items-center gap-3">
                                        <TagIcon className="w-5 h-5 text-blue-400" />
                                        <p className="text-lg font-medium text-gray-300">Service</p>
                                        
                                    </li>
                            <div className="mt-1">
                                <select 
                                    id="category" 
                                    name="category" 
                                    value={selectedCategory} 
                                    onChange={handleCategoryChange} 
                                    required 
                                    className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                >
                                    <option value="" disabled>Select a category</option>
                                    {Object.keys(serviceCategories).map((category) => (
                                        <option key={category} value={category}>{category.replace(/([A-Z])/g, ' $1').trim()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {selectedCategory && (
                            <div className="pt-2">
                                <label htmlFor="service" className="block text-sm font-medium text-gray-300">Service Type</label>
                                <div className="mt-1">
                                    <select 
                                        id="service" 
                                        name="service" 
                                        value={selectedService} 
                                        onChange={handleServiceChange} 
                                        required 
                                        className="appearance-none block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all duration-300" 
                                    >
                                        <option value="" disabled>Select a service</option>
                                        {serviceCategories[selectedCategory].map((service) => (
                                            <option key={service} value={service}>{service.replace(/([A-Z])/g, ' $1').trim()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="rounded-md bg-red-900/50 p-3">
                                <div className="flex">
                                    <div className="text-sm text-red-400">{error}</div>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-3">
                            <button 
                                type="submit" 
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-gray-200 bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-300 font-medium"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{" "}
                            <a href="/signin" className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-300">
                                Sign In
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUpEmployee;