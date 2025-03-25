import { auth } from "@/auth";
import { getServiceByName } from "@/data/homeservices";
import { getUsersByEmail } from "@/queries/users";
import Link from "next/link";

const ServiceDetailsPage = async ({ params }) => {
    const session = await auth();
    const loggedInUser = session?.user;
    const { name } = params;

    if (!name) {
        return <p className="text-center text-red-500 p-8">Invalid service selection.</p>;
    }

    const service = getServiceByName(name);
    if (!service) {
        return <p className="text-center text-red-500 p-8">Currently, this service is not available.</p>;
    }

    let user = null;
    if (loggedInUser?.email) {
        user = await getUsersByEmail(loggedInUser.email);
    }

    return (
        <div className="flex justify-center items-center dark:bg-gray-800 min-h-screen bg-gradient-to-b p-4">
            <div className="w-full max-w-2xl text-gray-300 dark:bg-gray-700 rounded-xl overflow-hidden">
                {/* Header Section */}
                <div className="relative group">
                    {service.image && (
                        <div className="w-full h-[350px] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 z-10 
                                          group-hover:via-black/40 group-hover:to-black/80 transition-all duration-500" />
                            <img 
                                src={service.image} 
                                alt={`${service.name}`} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 
                                         animate-kenburns"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                <div className="overflow-hidden">
                                    <h1 className="text-4xl font-bold text-center text-gray-300 drop-shadow-lg
                                                transform transition-all duration-500 
                                                group-hover:scale-110 group-hover:tracking-wider animate-slideRight">
                                        {service.name}
                                    </h1>
                                </div>
                                {/* Animated underline */}
                                <div className="w-28 h-1 bg-white mx-auto mt-3 transform scale-x-0 group-hover:scale-x-100 
                                              transition-transform duration-500 origin-center rounded-full opacity-0 
                                              group-hover:opacity-100" />
                                {/* Decorative elements */}
                                <div className="flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-6 transform transition-all duration-500 group-hover:translate-y-2">
                    <div className="text-gray-100 p-5 rounded-xl">
                        <p className="text-gray-300 leading-relaxed text-base">{service.about}</p>
                    </div>

                    {/* Features or Highlights Section */}
                    <div className="p-5 grid grid-cols-2 gap-3">
                        <div className="bg-gray-500 p-3 rounded-lg transform transition-all duration-300 
                                     hover:scale-105 hover:shadow-md group/feature hover:cursor-pointer">
                            <span className="text-gray-300 font-semibold flex items-center gap-2 text-sm">
                                <span className="transform transition-all duration-300 group-hover/feature:rotate-12">✨</span>
                                Premium Service
                            </span>
                        </div>
                        <div className="bg-gray-500 p-3 rounded-lg transform transition-all duration-300 
                                     hover:scale-105 hover:shadow-md group/feature hover:cursor-pointer">
                            <span className="text-gray-300 font-semibold flex items-center gap-2 text-sm">
                                <span className="transform transition-all duration-300 group-hover/feature:rotate-12">⚡</span>
                                Fast Response
                            </span>
                        </div>
                    </div>

                    {/* Booking Button */}
                    <div className="mt-6 flex justify-center">
                        <Link 
                            href={`/booking?service=${encodeURIComponent(service.name)}`}
                            className="group relative bg-gray-500 text-gray-300 px-8 py-3 rounded-lg
                                transition-all duration-500 shadow-lg 
                                     hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
                        >
                            <span className="relative z-10 font-semibold text-base ">
                                Book Service
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailsPage;