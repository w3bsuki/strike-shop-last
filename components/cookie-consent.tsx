'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 md:p-6 z-50 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-typewriter font-bold text-sm mb-1">COOKIE NOTICE</h3>
            <p className="text-xs md:text-sm text-gray-300">
              We use cookies to enhance your shopping experience, analyze site traffic, and personalize content. 
              By clicking "Accept", you consent to our use of cookies.{' '}
              <Link href="/privacy" className="underline hover:text-white">
                Privacy Policy
              </Link>
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={handleReject}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none bg-transparent border-white text-white hover:bg-white hover:text-black"
            >
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 md:flex-none bg-white text-black hover:bg-gray-200"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}