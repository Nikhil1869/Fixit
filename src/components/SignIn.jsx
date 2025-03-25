"use client"

import SocialSignIn from "./SocialSignIn";
import { doCredentialSignIn } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const SignIn = () => {
    const router = useRouter();
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function handleFormSubmit(event) {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const response = await doCredentialSignIn(formData);

            if (!!response.error) {
                setError(response.error.message);
            }
            else {
                router.push("/homeservices");
            }
        } catch (error) {
            setError("Check your credentials");
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="max-w-md mx-auto">
            
            <form id="signup-form" onSubmit={handleFormSubmit} className="space-y-6">
                <div className="relative">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                        Username
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            required 
                            placeholder="Enter Username" 
                            className="w-full pl-10 pr-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                        />
                    </div>
                </div>
                
                <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            name="password" 
                            required 
                            placeholder="Enter Password" 
                            className="w-full pl-10 pr-10 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                        />
                        <div 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" 
                            onClick={togglePasswordVisibility}
                        >
                            {showPassword ? (
                                <EyeOff size={18} className="text-gray-400 hover:text-gray-300" />
                            ) : (
                                <Eye size={18} className="text-gray-400 hover:text-gray-300" />
                            )}
                        </div>
                    </div>
                </div>
                
                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-400 bg-opacity-10 p-2 rounded">
                        {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-lg font-medium transition-colors duration-300"
                >
                    <LogIn size={20} />
                    <span>Sign In</span>
                </button>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">
                    Don't have an account? <Link href="/signup" className="text-blue-400 hover:text-blue-300">Create one</Link>
                    </p>
                </div>
            </form>
            
            {/* <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                    </div>
                </div>
                
                <div className="mt-6">
                    <SocialSignIn />
                </div>
            </div> */}
        </div>
    );
}

export default SignIn;