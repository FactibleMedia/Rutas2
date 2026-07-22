import React from "react";

/* =========================================================
   Decorative SVG components shared between TermsModal and TermsPage
   ========================================================= */

export const TopLeftGlyph = () => (
  <svg viewBox="0 0 120 150" width="96" height="120">
    <path d="M20,20 Q60,10 90,40 Q110,60 80,100 Q50,130 30,110 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M40,50 Q60,40 70,70" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="65" cy="55" r="4" fill="#2b2b2b" />
  </svg>
);

export const TopRightTicketWhisk = () => (
  <svg viewBox="0 0 180 150" width="130" height="110">
    <rect x="20" y="30" width="90" height="110" rx="4" fill="none" stroke="#2b2b2b" strokeWidth="2.5" transform="rotate(-15 65 85)" />
    <circle cx="50" cy="65" r="6" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <circle cx="75" cy="80" r="5" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <circle cx="60" cy="100" r="5" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <line x1="85" y1="50" x2="100" y2="65" stroke="#2b2b2b" strokeWidth="2" transform="rotate(-15 65 85)" />
    <line x1="85" y1="70" x2="100" y2="85" stroke="#2b2b2b" strokeWidth="2" transform="rotate(-15 65 85)" />
    <path d="M120,30 L160,80" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
    <path d="M145,55 Q160,50 170,65 Q160,80 145,75" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M140,50 Q155,40 170,55" fill="none" stroke="#2b2b2b" strokeWidth="2" />
  </svg>
);

export const MiddleLeftMermaid = () => (
  <svg viewBox="0 0 150 200" width="100" height="130">
    <path d="M30,80 Q50,60 80,70 Q110,90 90,130 Q70,160 40,150 Q20,130 30,80 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
    <circle cx="85" cy="55" r="18" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
    <path d="M70,45 Q85,35 100,50" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M90,130 Q120,150 140,110 Q150,90 130,80" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

export const MiddleRightLightbulb = () => (
  <svg viewBox="0 0 120 180" width="90" height="130">
    <path d="M40,20 L80,20 L80,40 Q95,60 95,85 Q95,120 60,130 L60,150 L60,165" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M45,75 Q60,65 75,75" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <circle cx="60" cy="85" r="12" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <line x1="50" y1="150" x2="70" y2="150" stroke="#2b2b2b" strokeWidth="2.5" />
    <line x1="53" y1="158" x2="67" y2="158" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

export const BottomLeftChurch = () => (
  <svg viewBox="0 0 140 180" width="100" height="120">
    <path d="M40,50 L70,20 L100,50 L100,160 L40,160 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M55,80 Q70,70 85,80 L85,120 L55,120 Z" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <circle cx="70" cy="38" r="6" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <line x1="70" y1="10" x2="70" y2="20" stroke="#2b2b2b" strokeWidth="2.5" />
    <line x1="64" y1="15" x2="76" y2="15" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

export const BottomRightSwirl = () => (
  <svg viewBox="0 0 140 140" width="90" height="90">
    <path d="M30,90 Q30,40 80,40 Q110,40 115,70 Q120,100 85,110 Q50,120 40,90 Q30,60 60,50" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M70,75 Q85,75 90,90" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
