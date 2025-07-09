"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AnnouncementMessage {
  id: string;
  text: string;
  cta?: {
    text: string;
    href: string;
  };
}

interface AnnouncementBannerProps {
  messages: AnnouncementMessage[];
  rotationInterval?: number;
  dismissible?: boolean;
  className?: string;
}

export function AnnouncementBanner({
  messages,
  rotationInterval = 5000,
  dismissible = true,
  className
}: AnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem("announcement-banner-dismissed");
    if (isDismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  // Rotate messages
  useEffect(() => {
    if (!isVisible || messages.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsAnimating(false);
      }, 300);
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [isVisible, messages.length, rotationInterval]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("announcement-banner-dismissed", "true");
  };

  if (!isVisible || messages.length === 0) return null;

  const currentMessage = messages[currentIndex];
  if (!currentMessage) return null;

  return (
    <div
      role="banner"
      aria-live="polite"
      aria-label="Announcements"
      className={cn(
        "relative w-full bg-black text-white overflow-hidden",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div className="h-full flex items-center justify-center px-4">
        <div className="flex items-center gap-2 md:gap-4 max-w-7xl mx-auto w-full">
          {/* Message */}
          <div className="flex-1 text-center">
            <p
              className={cn(
                "text-[10px] md:text-xs font-bold uppercase tracking-wider transition-opacity duration-300 line-clamp-1",
                isAnimating ? "opacity-0" : "opacity-100"
              )}
            >
              {currentMessage.text}
            </p>
          </div>

          {/* CTA Button */}
          {currentMessage.cta && (
            <Link
              href={currentMessage.cta.href}
              className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wider hover:underline transition-all"
              aria-label={`${currentMessage.cta.text} - Learn more about this announcement`}
            >
              {currentMessage.cta.text}
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute right-2 md:right-4 p-2 hover:bg-white/10 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Dismiss announcement"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}