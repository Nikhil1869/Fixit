'use client';

import { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import MainHome from '../components/MainHome';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // Optional: Ensure splash screen only shows on initial load
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem('hasSeenSplash', 'true');
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return showSplash ? (
    <SplashScreen onComplete={handleSplashComplete} />
  ) : (
    <MainHome />
  );
}