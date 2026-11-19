import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * High-definition 3D Image-Style Icons
 * Designed to replace generic AI-generated (vibecoded) outline icons
 * with rich dimensional visuals, metallic gradients, glass reflections and depth.
 */

export function Book3DIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="book-cover" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="book-pages" x1="18" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="book-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <filter id="book-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f766e" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Base shadow */}
      <ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" fillOpacity="0.15" />
      {/* Back Cover */}
      <rect x="10" y="14" width="44" height="38" rx="6" fill="#0f766e" />
      {/* Pages Block */}
      <path
        d="M14 16 C 24 18, 30 14, 32 15 C 34 14, 40 18, 50 16 L50 48 C 40 50, 34 46, 32 47 C 30 46, 24 50, 14 48 Z"
        fill="url(#book-pages)"
        stroke="#94a3b8"
        strokeWidth="0.8"
      />
      {/* Book Spine & Crease */}
      <path d="M32 15 L32 47" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cover Front Flap (3D Open Effect) */}
      <path
        d="M12 18 C 22 15, 28 17, 32 18 L32 50 C 28 49, 22 47, 12 50 Z"
        fill="url(#book-cover)"
        filter="url(#book-shadow)"
      />
      {/* Front Cover Sheen */}
      <path
        d="M14 20 C 20 18, 26 19, 30 20 L30 24 C 26 23, 20 22, 14 24 Z"
        fill="#ffffff"
        fillOpacity="0.35"
      />
      {/* Golden Bookmark Ribbon */}
      <path
        d="M30 14 L30 36 L34 32 L38 36 L38 14 Z"
        fill="url(#book-gold)"
        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))"
      />
      {/* Magic Star Sparkle */}
      <circle cx="46" cy="18" r="2.5" fill="#fef08a" />
      <polygon points="46,12 47.5,16.5 52,18 47.5,19.5 46,24 44.5,19.5 40,18 44.5,16.5" fill="#fef08a" />
    </svg>
  );
}

export function Diploma3DIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="cap-top" x1="8" y1="12" x2="56" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id="gold-tassel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="skull-cap" x1="20" y1="30" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" fillOpacity="0.15" />
      {/* Lower skullcap */}
      <path d="M22 28 C 22 28, 22 44, 32 44 C 42 44, 42 28, 42 28 Z" fill="url(#skull-cap)" />
      {/* Mortarboard Diamond Top */}
      <polygon points="32,10 58,22 32,34 6,22" fill="url(#cap-top)" stroke="#818cf8" strokeWidth="0.8" />
      {/* Glossy facet */}
      <polygon points="32,10 58,22 32,24 16,17" fill="#ffffff" fillOpacity="0.25" />
      {/* Center Button */}
      <ellipse cx="32" cy="22" rx="3.5" ry="2" fill="url(#gold-tassel)" />
      {/* Golden Tassel String */}
      <path d="M32 23 Q 46 24, 49 34" stroke="url(#gold-tassel)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Hanging Tassel Brush */}
      <path d="M47 34 L52 35 L51 46 C 49.5 47, 47.5 47, 46 46 Z" fill="url(#gold-tassel)" />
      {/* Golden Medal Coin at bottom right */}
      <circle cx="20" cy="46" r="7" fill="url(#gold-tassel)" stroke="#ffffff" strokeWidth="1" />
      <polygon points="20,41 21.5,44.5 25,45 22.5,47.5 23,51 20,49.2 17,51 17.5,47.5 15,45 18.5,44.5" fill="#ffffff" />
    </svg>
  );
}

export function Shield3DIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="shield-body" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="shield-rim" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="gold-lock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="32" cy="57" rx="18" ry="4" fill="#000" fillOpacity="0.15" />
      {/* Outer Shield Shell */}
      <path
        d="M32 8 C 44 8, 52 13, 52 24 C 52 40, 39 50, 32 54 C 25 50, 12 40, 12 24 C 12 13, 20 8, 32 8 Z"
        fill="url(#shield-rim)"
        stroke="#a7f3d0"
        strokeWidth="1.2"
      />
      {/* Inner Core */}
      <path
        d="M32 12 C 41 12, 48 16, 48 24 C 48 37, 37 46, 32 49 C 27 46, 16 37, 16 24 C 16 16, 23 12, 32 12 Z"
        fill="url(#shield-body)"
      />
      {/* Glossy Left Reflection */}
      <path
        d="M32 13 C 24 13, 18 17, 18 24 C 18 34, 25 43, 32 47 L32 13 Z"
        fill="#ffffff"
        fillOpacity="0.25"
      />
      {/* 3D Golden Padlock in center */}
      <rect x="25" y="27" width="14" height="11" rx="3" fill="url(#gold-lock)" stroke="#ca8a04" strokeWidth="0.8" />
      <path
        d="M28 27 V 22 C 28 19.8, 29.8 18, 32 18 C 34.2 18, 36 19.8, 36 22 V 27"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="32" cy="31.5" r="1.5" fill="#713f12" />
      <path d="M31.2 32 L32.8 32 L32.4 35 L31.6 35 Z" fill="#713f12" />
      {/* Sparkle */}
      <circle cx="44" cy="18" r="1.5" fill="#ffffff" />
    </svg>
  );
}

export function RevenueCoin3DIcon({ className = "", size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="gold-stack-1" x1="8" y1="14" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="gold-front" x1="12" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="80%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="28" cy="48" rx="18" ry="4" fill="#000" fillOpacity="0.2" />
      {/* Bottom Coin */}
      <ellipse cx="28" cy="38" rx="16" ry="7" fill="#b45309" />
      <path d="M12 38 C 12 42, 44 42, 44 38 L44 42 C 44 46, 12 46, 12 42 Z" fill="#78350f" />
      <ellipse cx="28" cy="42" rx="16" ry="6" fill="url(#gold-stack-1)" />

      {/* Middle Coin */}
      <ellipse cx="28" cy="30" rx="16" ry="7" fill="#b45309" />
      <path d="M12 30 C 12 34, 44 34, 44 30 L44 34 C 44 38, 12 38, 12 34 Z" fill="#92400e" />
      <ellipse cx="28" cy="34" rx="16" ry="6" fill="url(#gold-stack-1)" />

      {/* Top Front Coin - 3D Angle */}
      <ellipse cx="28" cy="20" rx="18" ry="12" fill="#78350f" />
      <path d="M10 20 C 10 25, 46 25, 46 20 L46 24 C 46 29, 10 29, 10 24 Z" fill="#92400e" />
      <ellipse cx="28" cy="20" rx="17" ry="11" fill="url(#gold-front)" stroke="#fef08a" strokeWidth="1" />
      <ellipse cx="28" cy="20" rx="13.5" ry="8.5" fill="none" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 2" />

      {/* Embossed Dollar Sign */}
      <text
        x="28"
        y="25"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="#78350f"
        fontFamily="sans-serif"
      >
        $
      </text>
      {/* Specular Glint */}
      <ellipse cx="22" cy="14" rx="4" ry="2" fill="#ffffff" fillOpacity="0.6" transform="rotate(-15 22 14)" />
      <circle cx="42" cy="12" r="1.5" fill="#fef08a" />
    </svg>
  );
}

export function StudentsCommunity3DIcon({ className = "", size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="avatar-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="avatar-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="avatar-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="28" cy="48" rx="18" ry="4" fill="#000" fillOpacity="0.15" />
      {/* Left Back Avatar */}
      <circle cx="17" cy="22" r="8" fill="url(#avatar-2)" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M7 40 C 7 32, 27 32, 27 40 Z" fill="url(#avatar-2)" opacity="0.9" />
      {/* Right Back Avatar */}
      <circle cx="39" cy="22" r="8" fill="url(#avatar-3)" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M29 40 C 29 32, 49 32, 49 40 Z" fill="url(#avatar-3)" opacity="0.9" />
      {/* Center Main Leader Avatar */}
      <circle cx="28" cy="18" r="9" fill="url(#avatar-1)" stroke="#ffffff" strokeWidth="2" />
      <path d="M16 43 C 16 33, 40 33, 40 43 Z" fill="url(#avatar-1)" stroke="#ffffff" strokeWidth="1.5" />
      {/* Glowing Star/Crown over center */}
      <circle cx="28" cy="7" r="2.5" fill="#fde047" />
      {/* Sheen */}
      <circle cx="25" cy="15" r="2" fill="#ffffff" fillOpacity="0.4" />
    </svg>
  );
}

export function Target3DIcon({ className = "", size = 56 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="target-teal" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="target-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Outer Rim */}
      <circle cx="32" cy="32" r="26" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      {/* Ring 1 - Teal */}
      <circle cx="32" cy="32" r="21" fill="url(#target-teal)" stroke="#5eead4" strokeWidth="1" />
      {/* Ring 2 - White */}
      <circle cx="32" cy="32" r="15" fill="#ffffff" />
      {/* Ring 3 - Dark Blue */}
      <circle cx="32" cy="32" r="10" fill="#0f766e" />
      {/* Bullseye Center - Gold */}
      <circle cx="32" cy="32" r="5" fill="url(#target-gold)" stroke="#ffffff" strokeWidth="1" />
      {/* Arrow hitting Bullseye */}
      <path d="M46 14 L33 29" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 12 L52 14 L50 22 Z" fill="url(#target-gold)" />
      {/* Arrow Vane / Feathers */}
      <path d="M48 10 L54 8 L52 14 Z" fill="#ef4444" />
      <path d="M42 16 L48 18 L46 24 Z" fill="#ef4444" />
      {/* Glint */}
      <circle cx="28" cy="24" r="2" fill="#ffffff" fillOpacity="0.6" />
    </svg>
  );
}

export function GrowthChart3DIcon({ className = "", size = 56 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="bar-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="bar-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id="bar-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="growth-arrow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Base Floor */}
      <rect x="8" y="52" width="48" height="4" rx="2" fill="#334155" />
      {/* 3D Column 1 */}
      <rect x="12" y="34" width="9" height="18" rx="2.5" fill="url(#bar-1)" />
      {/* 3D Column 2 */}
      <rect x="25" y="24" width="9" height="28" rx="2.5" fill="url(#bar-2)" />
      {/* 3D Column 3 (Tallest) */}
      <rect x="38" y="14" width="9" height="38" rx="2.5" fill="url(#bar-3)" />
      {/* Trending Up Dynamic Curved Arrow */}
      <path
        d="M10 38 Q 28 28, 48 12"
        stroke="url(#growth-arrow)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(74, 222, 128, 0.4))"
      />
      <polygon points="46,8 54,11 50,18" fill="#4ade80" />
      {/* Floating Gem on Top Column */}
      <circle cx="42.5" cy="14" r="2.5" fill="#fef08a" />
    </svg>
  );
}

export function SmartLearning3DIcon({ className = "", size = 56 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="orb-grad" x1="14" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="ring-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Outer Orbit Ring */}
      <ellipse cx="32" cy="32" rx="28" ry="10" stroke="url(#ring-glow)" strokeWidth="1.8" fill="none" transform="rotate(-25 32 32)" opacity="0.6" />
      {/* Central 3D Knowledge Orb */}
      <circle cx="32" cy="32" r="18" fill="url(#orb-grad)" stroke="#6ee7b7" strokeWidth="1" />
      {/* Inner Glowing Idea Bulb / Neural Mesh */}
      <circle cx="32" cy="32" r="10" fill="#ffffff" fillOpacity="0.15" />
      {/* Graduation Cap on top of Orb */}
      <polygon points="32,18 42,23 32,28 22,23" fill="#6366f1" stroke="#c7d2fe" strokeWidth="0.8" />
      <ellipse cx="32" cy="23" rx="1.5" ry="1" fill="#fef08a" />
      {/* Small orbiting satellite crystal */}
      <circle cx="50" cy="22" r="3" fill="#fde047" stroke="#ffffff" strokeWidth="1" />
      {/* Specular Highlight */}
      <circle cx="26" cy="24" r="3.5" fill="#ffffff" fillOpacity="0.6" />
    </svg>
  );
}

export function MobileMoney3DIcon({ className = "", size = 52 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="phone-body" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="phone-screen" x1="20" y1="12" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Phone Case */}
      <rect x="18" y="8" width="28" height="48" rx="6" fill="url(#phone-body)" stroke="#475569" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="21" y="14" width="22" height="36" rx="3" fill="url(#phone-screen)" />
      {/* Speaker Bar */}
      <rect x="28" y="11" width="8" height="1.5" rx="0.75" fill="#94a3b8" />
      {/* Big White Success Checkmark */}
      <circle cx="32" cy="30" r="7" fill="#ffffff" />
      <path d="M29 30 L31.5 32.5 L35.5 27.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Currency waves radiating from phone */}
      <path d="M48 20 C 52 24, 52 38, 48 42" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M52 16 C 58 22, 58 40, 52 46" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" fill="none" opacity="0.7" />
      {/* SIM Gold Chip Badge */}
      <rect x="25" y="40" width="14" height="6" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
    </svg>
  );
}

export function QuizExam3DIcon({ className = "", size = 52 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="clipboard" x1="16" y1="12" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      {/* Board Base */}
      <rect x="16" y="12" width="32" height="44" rx="4" fill="url(#clipboard)" stroke="#818cf8" strokeWidth="1.2" />
      {/* Paper Sheet */}
      <rect x="20" y="16" width="24" height="36" rx="2" fill="#ffffff" />
      {/* Top Metallic Clip */}
      <rect x="26" y="9" width="12" height="5" rx="1.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      {/* Checkmarks & Lines */}
      <circle cx="25" cy="24" r="2.5" fill="#10b981" />
      <path d="M24 24 L24.8 24.8 L26 23.2" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
      <rect x="30" y="23" width="11" height="2" rx="1" fill="#cbd5e1" />

      <circle cx="25" cy="31" r="2.5" fill="#10b981" />
      <path d="M24 31 L24.8 31.8 L26 30.2" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
      <rect x="30" y="30" width="11" height="2" rx="1" fill="#cbd5e1" />

      <circle cx="25" cy="38" r="2.5" fill="#6366f1" />
      <rect x="30" y="37" width="8" height="2" rx="1" fill="#cbd5e1" />

      {/* Golden A+ Star Stamp */}
      <circle cx="39" cy="45" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
      <text x="39" y="48.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">
        100%
      </text>
    </svg>
  );
}

export function CourseBuilder3DIcon({ className = "", size = 52 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="cube-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="cube-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>
        <linearGradient id="cube-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>
      </defs>
      {/* 3D Isometric Magic Modular Cube */}
      <g transform="translate(32, 30)">
        {/* Top facet */}
        <polygon points="0,-16 18,-6 0,4 -18,-6" fill="url(#cube-top)" stroke="#5eead4" strokeWidth="0.8" />
        {/* Left facet */}
        <polygon points="-18,-6 0,4 0,22 -18,12" fill="url(#cube-left)" />
        {/* Right facet */}
        <polygon points="0,4 18,-6 18,12 0,22" fill="url(#cube-right)" />
      </g>
      {/* Floating mini modules */}
      <circle cx="16" cy="18" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
      <circle cx="48" cy="18" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
      <polygon points="32,6 34,11 39,12 35,16 36,21 32,18 28,21 29,16 25,12 30,11" fill="#facc15" />
    </svg>
  );
}

export function GlobalAnalytics3DIcon({ className = "", size = 52 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="globe-ocean" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="50%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="globe-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Background Glow */}
      <circle cx="32" cy="32" r="22" fill="#6366f1" fillOpacity="0.15" />
      {/* Main Sphere */}
      <circle cx="32" cy="32" r="20" fill="url(#globe-ocean)" stroke="#818cf8" strokeWidth="1.2" />
      {/* Latitude / Longitude lines */}
      <ellipse cx="32" cy="32" rx="20" ry="7" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" />
      <ellipse cx="32" cy="32" rx="9" ry="20" fill="none" stroke="#6366f1" strokeWidth="1" />
      {/* Glowing African / Global land dots */}
      <circle cx="32" cy="28" r="2.5" fill="#2dd4bf" />
      <circle cx="36" cy="34" r="2" fill="#2dd4bf" />
      <circle cx="26" cy="30" r="2" fill="#38bdf8" />
      <circle cx="38" cy="24" r="1.5" fill="#facc15" />
      {/* Angled Orbit Ring */}
      <ellipse cx="32" cy="32" rx="27" ry="9" stroke="url(#globe-ring)" strokeWidth="2" fill="none" transform="rotate(-30 32 32)" />
      {/* Satellite Node on Ring */}
      <circle cx="53" cy="20" r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export function Templates3DIcon({ className = "", size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="layer-p1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
        <linearGradient id="layer-p2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Bottom Layer */}
      <polygon points="28,34 48,24 28,14 8,24" fill="#6b21a8" />
      <polygon points="28,38 48,28 48,31 28,41 8,31 8,28" fill="#581c87" />
      {/* Middle Layer */}
      <polygon points="28,26 48,16 28,6 8,16" fill="url(#layer-p1)" opacity="0.8" />
      <polygon points="28,30 48,20 48,23 28,33 8,23 8,20" fill="#7e22ce" />
      {/* Top Floating Glass Canvas */}
      <polygon points="28,18 48,8 28,-2 8,8" fill="url(#layer-p2)" stroke="#f5d0fe" strokeWidth="0.8" />
      {/* UI Grid lines on top layer */}
      <circle cx="28" cy="8" r="3" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}

export function AiChip3DIcon({ className = "", size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="chip-gold" x1="12" y1="12" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      {/* Metallic Pins */}
      <path d="M18 10 V6 M28 10 V6 M38 10 V6 M18 46 V50 M28 46 V50 M38 46 V50" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 18 H6 M10 28 H6 M10 38 H6 M46 18 H50 M46 28 H50 M46 38 H50" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ceramic Carrier */}
      <rect x="10" y="10" width="36" height="36" rx="8" fill="#1c1917" stroke="#44403c" strokeWidth="1.5" />
      {/* Gold Core Die */}
      <rect x="16" y="16" width="24" height="24" rx="5" fill="url(#chip-gold)" stroke="#fef08a" strokeWidth="1" />
      {/* Brain/Neural Matrix Icon */}
      <circle cx="28" cy="28" r="5" fill="#1c1917" />
      <circle cx="28" cy="28" r="2" fill="#fbbf24" />
      <circle cx="22" cy="22" r="1.5" fill="#fef08a" />
      <circle cx="34" cy="22" r="1.5" fill="#fef08a" />
      <circle cx="22" cy="34" r="1.5" fill="#fef08a" />
      <circle cx="34" cy="34" r="1.5" fill="#fef08a" />
      <path d="M23 23 L26 26 M33 23 L30 26 M23 33 L26 30 M33 33 L30 30" stroke="#fef08a" strokeWidth="1" />
    </svg>
  );
}

export function CodeZip3DIcon({ className = "", size = 44 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="zip-blue" x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      {/* Cube Box */}
      <rect x="10" y="12" width="36" height="34" rx="6" fill="url(#zip-blue)" stroke="#7dd3fc" strokeWidth="1.5" />
      {/* Box Flap Sheen */}
      <path d="M10 18 H46" stroke="#bae6fd" strokeWidth="1.5" />
      {/* Glowing Code Brackets */}
      <text x="28" y="36" textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffffff" fontFamily="monospace">
        &lt;/&gt;
      </text>
      {/* Zip Lock Tooth at top */}
      <rect x="25" y="8" width="6" height="7" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
    </svg>
  );
}

export function SpeedClock3DIcon({ className = "", size = 40 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md ${className}`}
    >
      <defs>
        <linearGradient id="clock-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#clock-teal)" stroke="#5eead4" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="14" fill="#ffffff" />
      {/* Hands pointing to speed */}
      <path d="M24 24 L24 15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 24 L31 24" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.5" fill="#0f766e" />
      {/* Turbo Speed Lines */}
      <path d="M6 18 H12 M4 24 H10 M6 30 H12" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CreditCard3DIcon({ className = "", size = 52 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="card-front" x1="12" y1="18" x2="52" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="card-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      {/* Back Card (Gold Premium) */}
      <rect x="18" y="14" width="38" height="24" rx="4" fill="url(#card-gold)" stroke="#ca8a04" strokeWidth="1" transform="rotate(8 37 26)" />
      {/* Front Card (Black Titanium) */}
      <rect x="10" y="22" width="40" height="26" rx="5" fill="url(#card-front)" stroke="#475569" strokeWidth="1.2" />
      {/* Chip */}
      <rect x="16" y="28" width="7" height="6" rx="1.5" fill="url(#card-gold)" />
      {/* Contactless waves */}
      <path d="M26 30 C 27 31, 27 32, 26 33" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M28 28.5 C 30 30.5, 30 32.5, 28 34.5" stroke="#94a3b8" strokeWidth="1" fill="none" />
      {/* Hologram Circle */}
      <circle cx="42" cy="40" r="3.5" fill="#ef4444" opacity="0.8" />
      <circle cx="45" cy="40" r="3.5" fill="#f59e0b" opacity="0.8" />
    </svg>
  );
}
