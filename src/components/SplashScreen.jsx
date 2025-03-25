'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen({ onComplete }) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [clickable, setClickable] = useState(false);

  useEffect(() => {
    // Set clickable to true after the animation completes
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      setClickable(true);
    }, 3000); // Animation takes about 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (clickable) {
      onComplete(); // Inform parent component to switch to main page
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="background-animation"></div>
      <div 
        className={`relative cursor-pointer ${clickable ? 'hover:scale-110 transition-transform' : ''}`}
        onClick={handleClick}
      >
        <Image
          src="/engineer.png"
          alt="FixIt Logo"
          width={200}
          height={200}
          className={`
            ${animationComplete ? 'pulse-effect' : 'animate-logo-entry'}
          `}
        />
        {clickable && (
          <div className="absolute top-full left-0 right-0 text-center mt-4 text-white">
            Click to continue
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes logoEntry {
          0% {
            transform: translate(-200%, -200%) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(1800deg);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.05);
            filter: brightness(1.2);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes gradientAnimation {
          0% {
            background: rgb(5, 133, 202);
          }
          100% {
            background: black;
          }
        }

        .background-animation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgb(9, 130, 195);
          animation: gradientAnimation 3s ease forwards; /* Change duration to match logo animation */
          z-index: -1; /* Ensure the background is behind the logo */
        }

        .animate-logo-entry {
          animation: logoEntry 3s forwards;
        }
        
        .pulse-effect {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}