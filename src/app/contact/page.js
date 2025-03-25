'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutDevelopers() {
    const developers = [
        {
            name: "Nikhil",
            role: "Frontend Developer",
            bio: "Passionate about creating user-friendly interfaces and improving UX.",
            image: "/nikhil.jpg",
            linkedin: "https://linkedin.com/in/johndoe",
            github: "https://github.com/johndoe"
        },
        {
            name: "Vishal",
            role: "Backend Developer",
            bio: "Loves building scalable and efficient server-side applications.",
            image: "/vishal.jpeg",
            linkedin: "https://linkedin.com/in/vishalkarnati",
            github: "https://github.com/Vishal-05y"
        },
        {
            name: "Santosh",
            role: "UI/UX Designer",
            bio: "Focused on designing beautiful and intuitive user experiences.",
            image: "/santosh.jpeg",
            linkedin: "https://linkedin.com/in/ramineni-karthik-santosh-1b6272322/",
            github: "https://github.com/RKarthikSantosh"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-10">
            <div className="max-w-5xl mx-auto mb-16 text-center">
                <h1 className="text-4xl font-bold mb-6">Meet the Developers</h1>
                <div className="bg-gray-800 rounded-lg p-8 mb-10">
                    <h2 className="text-2xl font-semibold mb-4">About Our Project</h2>
                    <p className="text-lg mb-4">
                        We are students from CVR College of Engineering working on FixIt, an innovative service booking platform that addresses the common challenges in finding and hiring reliable service providers.
                    </p>
                    <p className="mb-6">
                        Our solution connects users with verified service professionals across various categories including home repairs, electronics maintenance, plumbing, electrical work, and more. Through FixIt, users can book services, track appointments, make secure payments, and provide feedback - all in one seamless platform.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 justify-center">
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <h3 className="font-semibold text-green-400 mb-2">Easy Booking</h3>
                            <p className="text-sm">Book services in just a few clicks with our intuitive interface</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <h3 className="font-semibold text-green-400 mb-2">Verified Providers</h3>
                            <p className="text-sm">All service providers undergo thorough background checks</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {developers.map((dev, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-lg text-center shadow-lg">
                        <Image src={dev.image} alt={dev.name} width={120} height={120} className="rounded-full mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold">{dev.name}</h2>
                        <h3 className="text-green-400 text-lg">{dev.role}</h3>
                        <p className="mt-2 text-gray-300">{dev.bio}</p>
                        <div className="mt-4 flex justify-center gap-4">
                            <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                <span className="sr-only">LinkedIn</span>
                            </a>
                            <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                <span className="sr-only">GitHub</span>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}