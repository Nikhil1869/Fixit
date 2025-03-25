"use client";

import { getAllServiceCategories, getServicesByCategory } from "@/data/homeservices";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
};

const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
};

// Simple array of 4 images to be used in rotation
const serviceImages = [
    "/beautyandwellness.jpg",
    "/homeservicess.jpg",
    "/domestichelp.jpg",
    "/professionalservices.jpg"
];

const ServiceList = () => {
    const searchParams = useSearchParams();
    const category = searchParams.get("category");

    const categories = getAllServiceCategories();
    const categoryServices = new Map();
    
    if (category) {
        categoryServices.set(category, getServicesByCategory(category));
    } else {
        categories.forEach(cat => {
            categoryServices.set(cat, getServicesByCategory(cat));
        });
    }

    return (
        <div className="flex justify-center items-center min-h-screen custom-bg_text p-4 overflow-hidden">
            <motion.div 
                className="custom-bg_text p-6 w-full max-w-5xl"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.h1 
                    className="text-3xl sm:text-4xl font-bold text-center mb-6 dark:text-gray-200 break-words"
                    variants={titleVariants}
                >
                    SERVICE CATEGORIES
                </motion.h1>

                <motion.div 
                    className="grid grid-cols-1 gap-6"
                    variants={containerVariants}
                >
                    {[...categoryServices.keys()].map((cat, index) => {
                        const imageIndex = index % serviceImages.length; // Ensure it cycles through the available images
                        const isEven = index % 2 === 0; // Determine if the index is even or odd
                        
                        return (
                            <Link key={cat} href={`/homeservices/category/services?category=${encodeURIComponent(cat)}`}>
                                <motion.div 
                                    className={`flex ${isEven ? 'flex-row' : 'flex-row-reverse'} w-full bg-white dark:bg-gray-700 shadow-md rounded-2xl overflow-hidden h-[400px]`} // Increased height
                                    variants={cardVariants}
                                    whileHover="hover"
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                >
                                    {/* Image Container */}
                                    <div className="relative h-full flex-shrink-0 w-1/2">
                                        <Image
                                            src={serviceImages[imageIndex]}
                                            alt={cat}
                                            fill
                                            className="object-cover transition-transform duration-300 ease-in-out" // Use object-cover and add transition
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority={index < 2} // Prioritize first two images
                                        />
                                    </div>
                                    
                                    {/* Content Container */}
                                    <div className="p-6 text-center flex-grow flex flex-col w-1/2">
                                        <motion.h2 
                                            className="text-2xl font-semibold dark:text-gray-300 mb-2 sm:mb-4" // Increased font size
                                            layoutId={`title-${cat}`}
                                        >
                                            {cat}
                                        </motion.h2>
                                        <motion.div 
                                            className="flex-grow"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            {categoryServices.get(cat).map((service, serviceIndex) => (
                                                <motion.p 
                                                    key={service.name} 
                                                    className="dark:text-gray-400 text-lg sm:text-xl" // Increased font size
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * serviceIndex }}
                                                >
                                                    {service.name}
                                                </motion.p>
                                            ))}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ServiceList;