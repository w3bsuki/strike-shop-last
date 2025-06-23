'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Heart } from 'lucide-react';

// Mock Instagram-style posts data
const communityPosts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&h=400&fit=crop&crop=center",
    username: "@strike_style",
    likes: 847,
    caption: "New season vibes 🔥",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop&crop=center",
    username: "@urban_explorer",
    likes: 623,
    caption: "Street ready ⚡",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop&crop=center",
    username: "@minimal_life",
    likes: 1203,
    caption: "Less is more ✨",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1542327897-d73f4005b533?w=400&h=400&fit=crop&crop=center",
    username: "@fashion_forward",
    likes: 956,
    caption: "Future of fashion 🚀",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
    username: "@strike_community",
    likes: 1456,
    caption: "Join the movement 💫",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop&crop=center",
    username: "@style_hunter",
    likes: 734,
    caption: "Always hunting 🎯",
  },
];

export const CommunityCarouselLazy = () => (
  <section className="section-padding bg-black text-white">
    <div className="strike-container">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">STRIKE COMMUNITY</h2>
        <p className="text-gray-300 mb-4">Share your STRIKE style with #StrikeStyle</p>
        <Link 
          href="https://instagram.com/strike" 
          className="inline-flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
        >
          <Instagram className="h-5 w-5" />
          <span>Follow @strike</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {communityPosts.map((post) => (
          <div 
            key={post.id} 
            className="group relative overflow-hidden bg-gray-900 aspect-square hover:scale-105 transition-transform duration-300"
          >
            <img
              src={post.image}
              alt={`Post by ${post.username}`}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">@{post.username.replace('@', '')}</span>
                <Instagram className="h-4 w-4" />
              </div>
              
              <div>
                <p className="text-xs mb-2 line-clamp-2">{post.caption}</p>
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span className="text-xs">{post.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link 
          href="https://instagram.com/strike"
          className="inline-block bg-white text-black px-6 py-3 font-bold hover:bg-gray-100 transition-colors"
        >
          VIEW MORE ON INSTAGRAM
        </Link>
      </div>
    </div>
  </section>
);
