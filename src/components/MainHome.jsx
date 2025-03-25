'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function MainHome() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoTransition, setVideoTransition] = useState('slide-in');

  const videos = [
    '/carpenter.mp4',
    '/electrician.mp4',
    '/spa.mp4',
    '/painting.mp4',
    '/yogatrainer.mp4',
    '/housecleaning.mp4',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoTransition('slide-out');
      setTimeout(() => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
        setVideoTransition('slide-in');
      }, 500); // Transition duration
    }, 5000); // Video change interval

    return () => clearTimeout(timer);
  }, [currentVideoIndex]);

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-800 text-gray-200">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-16 px-4 bg-gray-900/90">
        <h1 className="text-5xl font-bold mb-6 animate-fade-in tracking-tight">
          Find Trusted Professionals for Any Service
        </h1>
        <p className="text-xl mb-8 text-gray-300">Fast, Easy, and Reliable Solutions</p>
        <div className="flex gap-6 animate-fade-in-up">
          <Link href="/homeservices" passHref>
            <button className="px-8 py-3 bg-green-600 rounded-full hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-green-500/20">
              Book a Service
            </button>
          </Link>
          <Link href="/signupEmployee" passHref>
            <button className="px-8 py-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
              Become a Provider
            </button>
          </Link>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="flex flex-col md:flex-row justify-center gap-8 px-6 py-12 max-w-7xl mx-auto">
        {/* Trending Services */}
        <div className="bg-gray-900/90 p-8 rounded-xl w-full md:w-1/2 shadow-xl border border-gray-700/50 transition-all duration-300 hover:shadow-gray-700/20">
          <h2 className="text-2xl font-semibold mb-6 text-white tracking-wide">Trending Services</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: 'Barber', icon: '/barber.png', link: '/homeservices/service/Barber' },
              { name: 'Carpenter', icon: '/barber.png', link: '/homeservices/service/Carpenter' },
              { name: 'Electrician', icon: '/electrician.png', link: '/homeservices/service/Electrician' },
              { name: 'Plumber', icon: '/plumber.png', link: '/homeservices/service/Plumber' },
              { name: 'Painter', icon: '/painter.png', link: '/homeservices/service/Painter' },
              { name: 'Maid Service', icon: '/maid.png', link: '/homeservices/service/MaidService' },
              { name: 'Laundry', icon: '/laundry.png', link: '/homeservices/service/LaundryService' },
              { name: 'Photographer', icon: '/photographer.png', link: '/homeservices/service/Photographer' },
              { name: 'Web Developer', icon: '/webdeveloper.png', link: '/homeservices/service/WebDeveloper' },
            ].map((service, index) => (
              <Link key={index} href={service.link} passHref>
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className="p-3 bg-gray-800 rounded-full group-hover:bg-gray-700 transition-colors duration-300">
                    <Image src={service.icon} alt={service.name} width={40} height={40} />
                  </div>
                  <p className="text-sm mt-3 group-hover:text-white transition-colors duration-300">{service.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Video Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="max-w-[800px] h-[450px] overflow-hidden rounded-xl mx-auto">
            <div className={`transition-transform duration-500 ${videoTransition}`}>
              <video
                key={videos[currentVideoIndex]}
                src={videos[currentVideoIndex]}
                autoPlay
                muted
                loop={false}
                className="w-[800px] h-[450px] object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Spa for Women Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-white text-left mb-8 tracking-wide pl-8">Spa for Women</h2>
        <div className="flex flex-row gap-4 justify-start pl-8">
          {[
            { src: '/spa1.jpg', text: 'Massage Therapy', link: '/homeservices/service/MassageTherapy' },
            { src: '/spa2.jpg', text: 'Beautician', link: '/homeservices/service/Beautician' },
            { src: '/spa3.jpg', text: 'Spa Therapy', link: '/homeservices/service/SpaTherapist' },
            { src: '/spa4.jpg', text: 'Hair Spa', link: '/homeservices/service/Barber' },
          ].map((item, index) => (
            <Link key={index} href={item.link} passHref>
              <div className="relative flex flex-col items-start cursor-pointer flex-shrink-0">
                <Image
                  src={item.src}
                  alt={item.text}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white font-semibold text-sm py-1 px-2 rounded-b-lg">
                  {item.text}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* We are Experts in Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-white text-left mb-8 tracking-wide pl-8">We are Experts in</h2>
        <div className="flex flex-row gap-4 justify-start pl-8">
          {[
            { src: '/expert1.jpg', text: 'Electrician', link: '/homeservices/service/Electrician' },
            { src: '/expert2.jpg', text: 'Carpenter', link: '/homeservices/service/Carpenter' },
            { src: '/expert3.jpg', text: 'Home Cleaning', link: '/homeservices/service/HomeCleaner' },
            { src: '/expert4.jpg', text: 'Painting', link: '/homeservices/service/Painter' },
            { src: '/expert5.jpg', text: 'Photographer', link: '/homeservices/service/Photographer' },
          ].map((item, index) => (
            <Link key={index} href={item.link} passHref>
              <div className="relative flex flex-col items-start cursor-pointer flex-shrink-0">
                <Image
                  src={item.src}
                  alt={item.text}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white font-semibold text-sm py-1 px-2 rounded-b-lg">
                  {item.text}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="p-12 bg-gray-900 text-center border-t border-gray-700/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center md:items-start">
            <Image src="/engineer.png" alt="FixIt Logo" width={60} height={60} />
            <h3 className="text-xl font-semibold text-white mt-4">FIXIT</h3>
            <p className="text-sm text-gray-400 mt-2">India's #1 Service Booking Platform</p>
          </div>
          <div className="flex flex-col items-center">
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300">
                About Us
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300">
                Contact Us
              </Link>
              <Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-300">
                FAQs
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms & Policies
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex gap-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.794.715-1.794 1.763v2.31h3.587l-.467 3.622h-3.12V24h6.116c.729 0 1.325-.597 1.325-1.324V1.325C24 .597 23.403 0 22.675 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <p className="text-gray-400 mt-8 text-sm">Available in major cities worldwide</p>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-in-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-in-out;
        }

        .slide-in {
          transform: translateX(0);
        }

        .slide-out {
          transform: translateX(-100%);
        }
      `}</style>
    </div>
  );
}