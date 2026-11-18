import React from 'react';

interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
});

export function IconLogo({ size = 52 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="logo-glow">
      <rect x="3" y="8" width="18" height="13" rx="3" stroke="#00f0ff" strokeWidth="2" />
      <path d="M8.5 3.5 12 7l3.5-3.5" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11.2v6.2l5.2-3.1z" fill="#00f0ff" />
    </svg>
  );
}

export function IconHome({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
    </svg>
  );
}

export function IconTv({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8 3l4 4 4-4" />
    </svg>
  );
}

export function IconSports({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8" />
    </svg>
  );
}

export function IconGuide({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7.5 9h.01M7.5 12h.01M7.5 15h.01M11 9h6M11 12h6M11 15h6" />
    </svg>
  );
}

export function IconRadio({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <path d="M7 8 17 3.5" />
      <circle cx="8.5" cy="14" r="2" />
      <path d="M13.5 12.5H18M13.5 15.5H18" />
    </svg>
  );
}

export function IconSearch({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  );
}

export function IconBell({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconGear({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </svg>
  );
}

export function IconStar({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
        fill="#fbbf24"
      />
    </svg>
  );
}

export function IconPlay({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
    </svg>
  );
}
