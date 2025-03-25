// 'use client'

// import { useRouter } from "next/navigation";
// import { useState } from "react";

// const SignUpCustomer = () => {
//     const router = useRouter();
//     const [error, setError] = useState("");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [focusedField, setFocusedField] = useState(null);

//     async function handleSubmit(event) {
//         event.preventDefault();
//         setIsSubmitting(true);
//         setError("");
        
//         try {
//             const formData = new FormData(event.currentTarget);

//             const username = formData.get('username');
//             const email = formData.get('email');
//             const phone = formData.get('phone');
//             const password = formData.get('password');
//             const street = formData.get('street');
//             const city = formData.get('city');
//             const state = formData.get('state');

//             const response = await fetch('/api/register', {
//                 method: 'POST',
//                 headers: {
//                     'content-type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     username, 
//                     email, 
//                     phone, 
//                     password, 
//                     street, 
//                     city, 
//                     state
//                 }),
//             });

//             if(response.status !== 201){
//                 setError("Registration failed. Please try again.");
//             }
//             else{
//                 router.push('/signin');       
//             }
//         } catch (error) {
//             setError("User already exists");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleFocus = (fieldName) => {
//         setFocusedField(fieldName);
//     };

//     const handleBlur = () => {
//         setFocusedField(null);
//     };

//     return (
//         <div className="flex justify-center items-center min-h-screen bg-gray-800 pt-7 pb-7">
//             <div className="bg-gray-700 p-8 rounded-lg shadow-lg w-full max-w-lg text-center transform transition-all duration-300 hover:shadow-xl">
//                 <h1 className="text-2xl font-bold mb-6 text-gray-200">Create Your Account</h1>
                
//                 {error && (
//                     <div className="mb-6 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-md text-sm font-medium animate-pulse">
//                         {error}
//                     </div>
//                 )}
                
//                 <form id="signupForm" onSubmit={handleSubmit} className="space-y-6">
//                     <div className="bg-gray-750 p-5 rounded-md mb-6">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center">
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
//                             </svg>
//                             Customer Information
//                         </h2>
                        
//                         <div className="space-y-4">
//                             <div className="relative text-left">
//                                 <label htmlFor="username" className={`text-sm font-medium ${focusedField === 'username' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                     Username
//                                 </label>
//                                 <input 
//                                     type="text" 
//                                     id="username" 
//                                     name="username" 
//                                     placeholder="Enter Username" 
//                                     required 
//                                     className={`mt-1 w-full px-4 py-3 border ${focusedField === 'username' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                     onFocus={() => handleFocus('username')}
//                                     onBlur={handleBlur}
//                                 />
//                             </div>
                            
//                             <div className="relative text-left">
//                                 <label htmlFor="email" className={`text-sm font-medium ${focusedField === 'email' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                     Email
//                                 </label>
//                                 <input 
//                                     type="email" 
//                                     id="email" 
//                                     name="email" 
//                                     placeholder="Enter Email" 
//                                     required 
//                                     className={`mt-1 w-full px-4 py-3 border ${focusedField === 'email' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                     onFocus={() => handleFocus('email')}
//                                     onBlur={handleBlur}
//                                 />
//                             </div>
                            
//                             <div className="relative text-left">
//                                 <label htmlFor="phone" className={`text-sm font-medium ${focusedField === 'phone' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                     Phone Number
//                                 </label>
//                                 <input 
//                                     type="tel" 
//                                     id="phone" 
//                                     name="phone" 
//                                     placeholder="Enter Phone-Number" 
//                                     required 
//                                     className={`mt-1 w-full px-4 py-3 border ${focusedField === 'phone' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                     onFocus={() => handleFocus('phone')}
//                                     onBlur={handleBlur}
//                                 />
//                             </div>
                            
//                             <div className="relative text-left">
//                                 <label htmlFor="password" className={`text-sm font-medium ${focusedField === 'password' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                     Password
//                                 </label>
//                                 <input 
//                                     type="password" 
//                                     id="password" 
//                                     name="password" 
//                                     placeholder="Enter Password" 
//                                     required 
//                                     className={`mt-1 w-full px-4 py-3 border ${focusedField === 'password' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                     onFocus={() => handleFocus('password')}
//                                     onBlur={handleBlur}
//                                 />
//                             </div>
//                         </div>
//                     </div>
                    
//                     <div className="bg-gray-750 p-5 rounded-md">
//                         <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center">
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
//                             </svg>
//                             Address
//                         </h2>
                        
//                         <div className="space-y-4">
//                             <div className="relative text-left">
//                                 <label htmlFor="street" className={`text-sm font-medium ${focusedField === 'street' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                     Street Address
//                                 </label>
//                                 <input 
//                                     type="text" 
//                                     id="street" 
//                                     name="street" 
//                                     placeholder="Enter Street Address" 
//                                     required 
//                                     className={`mt-1 w-full px-4 py-3 border ${focusedField === 'street' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                     onFocus={() => handleFocus('street')}
//                                     onBlur={handleBlur}
//                                 />
//                             </div>
                            
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                 <div className="relative text-left">
//                                     <label htmlFor="city" className={`text-sm font-medium ${focusedField === 'city' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                         City
//                                     </label>
//                                     <input 
//                                         type="text" 
//                                         id="city" 
//                                         name="city" 
//                                         placeholder="Enter City" 
//                                         required 
//                                         className={`mt-1 w-full px-4 py-3 border ${focusedField === 'city' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                         onFocus={() => handleFocus('city')}
//                                         onBlur={handleBlur}
//                                     />
//                                 </div>
                                
//                                 <div className="relative text-left">
//                                     <label htmlFor="state" className={`text-sm font-medium ${focusedField === 'state' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
//                                         State
//                                     </label>
//                                     <input 
//                                         type="text" 
//                                         id="state" 
//                                         name="state" 
//                                         placeholder="Enter State" 
//                                         required 
//                                         className={`mt-1 w-full px-4 py-3 border ${focusedField === 'state' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200`} 
//                                         onFocus={() => handleFocus('state')}
//                                         onBlur={handleBlur}
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
                    
//                     <button 
//                         type="submit" 
//                         className={`mt-8 w-full py-3 px-4 rounded-md bg-gray-500 text-gray-200 font-medium text-lg transition-all duration-300 transform hover:bg-gray-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
//                         disabled={isSubmitting}
//                     >
//                         {isSubmitting ? (
//                             <span className="flex items-center justify-center">
//                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                 </svg>
//                                 Creating Account...
//                             </span>
//                         ) : 'Sign Up'}
//                     </button>
                    
//                     <div className="mt-6 text-sm text-gray-400">
//                         Already have an account?{' '}
//                         <a href="/signin" className="text-gray-300 hover:text-white transition-colors duration-200">
//                             Sign in
//                         </a>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

// export default SignUpCustomer;

'use client'

import { UserIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignUpCustomer = () => {
    const router = useRouter();
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        
        try {
            const formData = new FormData(event.currentTarget);

            const username = formData.get('username');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const password = formData.get('password');
            const street = formData.get('street');
            const city = formData.get('city');
            const state = formData.get('state');

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
                    street, 
                    city, 
                    state
                }),
            });

            if(response.status !== 201){
                setError("Registration failed. Please try again.");
            }
            else{
                router.push('/signin');       
            }
        } catch (error) {
            setError("User already exists");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFocus = (fieldName) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800 pt-7 pb-7">
            <div className="bg-gray-700 p-8 rounded-lg shadow-lg w-full max-w-lg text-center transform transition-all duration-300 hover:shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-gray-200">Create Your Account</h1>
                
                {error && (
                    <div className="mb-6 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-md text-sm font-medium animate-pulse">
                        {error}
                    </div>
                )}
                
                <form id="signupForm" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-750 p-5 rounded-md mb-6">
                        <div className="mb-6 text-center">
                            <div className="mb-4 flex items-center justify-center text-3xl font-bold text-blue-500">
                                <UserIcon className="w-11 h-11" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Customer Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative text-left">
                                <label htmlFor="username" className={`text-sm font-medium ${focusedField === 'username' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                    Username
                                </label>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    placeholder="Enter Username" 
                                    required 
                                    className={`mt-1 w-full px-4 py-3 border ${focusedField === 'username' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                    onFocus={() => handleFocus('username')}
                                    onBlur={handleBlur}
                                />
                            </div>
                            
                            <div className="relative text-left">
                                <label htmlFor="email" className={`text-sm font-medium ${focusedField === 'email' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                    Email
                                </label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="Enter Email" 
                                    required 
                                    className={`mt-1 w-full px-4 py-3 border ${focusedField === 'email' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                    onFocus={() => handleFocus('email')}
                                    onBlur={handleBlur}
                                />
                            </div>
                            
                            <div className="relative text-left">
                                <label htmlFor="phone" className={`text-sm font-medium ${focusedField === 'phone' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                    Phone Number
                                </label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    placeholder="Enter Phone-Number" 
                                    required 
                                    className={`mt-1 w-full px-4 py-3 border ${focusedField === 'phone' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                    onFocus={() => handleFocus('phone')}
                                    onBlur={handleBlur}
                                />
                            </div>
                            
                            <div className="relative text-left">
                                <label htmlFor="password" className={`text-sm font-medium ${focusedField === 'password' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                    Password
                                </label>
                                <div className="relative mt-1">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="password" 
                                        name="password" 
                                        placeholder="Enter Password" 
                                        required 
                                        className={`w-full px-4 py-3 border ${focusedField === 'password' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                        onFocus={() => handleFocus('password')}
                                        onBlur={handleBlur}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-750 p-5 rounded-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-blue-500" />
                            Address
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="relative text-left">
                                <label htmlFor="street" className={`text-sm font-medium ${focusedField === 'street' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                    Street Address
                                </label>
                                <input 
                                    type="text" 
                                    id="street" 
                                    name="street" 
                                    placeholder="Enter Street Address" 
                                    required 
                                    className={`mt-1 w-full px-4 py-3 border ${focusedField === 'street' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                    onFocus={() => handleFocus('street')}
                                    onBlur={handleBlur}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative text-left">
                                    <label htmlFor="city" className={`text-sm font-medium ${focusedField === 'city' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                        City
                                    </label>
                                    <input 
                                        type="text" 
                                        id="city" 
                                        name="city" 
                                        placeholder="Enter City" 
                                        required 
                                        className={`mt-1 w-full px-4 py-3 border ${focusedField === 'city' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                        onFocus={() => handleFocus('city')}
                                        onBlur={handleBlur}
                                    />
                                </div>
                                
                                <div className="relative text-left">
                                    <label htmlFor="state" className={`text-sm font-medium ${focusedField === 'state' ? 'text-gray-200' : 'text-gray-400'} transition-colors duration-200`}>
                                        State
                                    </label>
                                    <input 
                                        type="text" 
                                        id="state" 
                                        name="state" 
                                        placeholder="Enter State" 
                                        required 
                                        className={`mt-1 w-full px-4 py-3 border ${focusedField === 'state' ? 'border-gray-400' : 'border-gray-500'} text-gray-200 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200`} 
                                        onFocus={() => handleFocus('state')}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className={`mt-8 w-full py-3 px-4 rounded-md bg-blue-500 text-gray-200 font-medium text-lg transition-all duration-300 transform hover:bg-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75 " fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </span>
                        ) : 'Sign Up'}
                    </button>
                    
                    <div className="mt-6 text-sm text-gray-400">
                        Already have an account?{' '}
                        <a href="/signin" className="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                            Sign in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUpCustomer;