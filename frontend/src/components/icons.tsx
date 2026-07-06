'use client';
import React from 'react';

interface IconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

function Icon({ size = 24, strokeWidth = 2, color = 'currentColor', style, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function HeartIcon(p: IconProps) {
  return <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>;
}
export function HeartFilledIcon(p: IconProps & { filled?: boolean }) {
  return <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={p.filled ? 'currentColor' : 'none'}/></Icon>;
}
export function ShareIcon(p: IconProps) {
  return <Icon {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></Icon>;
}
export function ChevronLeftIcon(p: IconProps) {
  return <Icon {...p}><polyline points="15,18 9,12 15,6"/></Icon>;
}
export function ChevronRightIcon(p: IconProps) {
  return <Icon {...p}><polyline points="9,18 15,12 9,6"/></Icon>;
}
export function TrophyIcon(p: IconProps) {
  return <Icon {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Icon>;
}
export function ClockIcon(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></Icon>;
}
export function HomeIcon(p: IconProps) {
  return <Icon {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></Icon>;
}
export function RadioIcon(p: IconProps) {
  return <Icon {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></Icon>;
}
export function TicketIcon(p: IconProps) {
  return <Icon {...p}><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5z"/></Icon>;
}
export function StarIcon(p: IconProps) {
  return <Icon {...p}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></Icon>;
}
export function UserIcon(p: IconProps) {
  return <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
}
export function SearchIcon(p: IconProps) {
  return <Icon {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Icon>;
}
export function BellIcon(p: IconProps) {
  return <Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Icon>;
}
export function AppleIcon(p: IconProps) {
  return <Icon {...p}><path d="M12.5 3C10.5 3 9 4 8.3 5.3 7.5 4 6 3 4.5 4c-.5 2 .5 4 1.5 5-1.5.2-2.8 1.2-3 2.8C2.5 14 4 16 6 16.5c.5 1 1.3 2 2.5 2.5.5.2 1 .3 1.5 0 .5.3 1 .3 1.5 0 1.2-.5 2-1.5 2.5-2.5C16 16 17.5 14 17 11.8c-.2-1.6-1.5-2.6-3-2.8 1-1 2-3 1.5-5C14 3 13.5 3 12.5 3z"/></Icon>;
}
export function PhoneIcon(p: IconProps) {
  return <Icon {...p}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Icon>;
}
