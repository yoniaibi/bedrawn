interface LogoProps {
  width?: number;
  /** Background colour the logo sits on — notch circles must match */
  bg?: string;
}

export default function Logo({ width = 160, bg = '#FFFFFF' }: LogoProps) {
  const height = Math.round(width * (140 / 400));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 140"
      width={width}
      height={height}
      aria-label="BeDrawn"
    >
      <defs>
        <clipPath id="ticket-clip">
          <rect x="20" y="10" width="360" height="120" rx="14" />
        </clipPath>
      </defs>
      {/* Background — matches the page so notches cut through */}
      <rect width="400" height="140" fill={bg} />
      <g clipPath="url(#ticket-clip)">
        {/* Ticket body */}
        <rect x="20" y="10" width="360" height="120" fill="#FF2356" />
        {/* Stub */}
        <rect x="302" y="10" width="78" height="120" fill="#CC1A47" />
        {/* Top notches */}
        <circle cx="56"  cy="10"  r="11" fill={bg} />
        <circle cx="97"  cy="10"  r="11" fill={bg} />
        <circle cx="138" cy="10"  r="11" fill={bg} />
        <circle cx="179" cy="10"  r="11" fill={bg} />
        <circle cx="220" cy="10"  r="11" fill={bg} />
        <circle cx="271" cy="10"  r="11" fill={bg} />
        <circle cx="312" cy="10"  r="11" fill={bg} />
        <circle cx="353" cy="10"  r="11" fill={bg} />
        {/* Bottom notches */}
        <circle cx="56"  cy="130" r="11" fill={bg} />
        <circle cx="97"  cy="130" r="11" fill={bg} />
        <circle cx="138" cy="130" r="11" fill={bg} />
        <circle cx="179" cy="130" r="11" fill={bg} />
        <circle cx="220" cy="130" r="11" fill={bg} />
        <circle cx="271" cy="130" r="11" fill={bg} />
        <circle cx="312" cy="130" r="11" fill={bg} />
        <circle cx="353" cy="130" r="11" fill={bg} />
        {/* Tear line */}
        <line
          x1="302" y1="10" x2="302" y2="130"
          stroke="#0D0B14" strokeWidth="2.5"
          strokeDasharray="6 5" strokeLinecap="round"
        />
        {/* Wordmark */}
        <text
          x="161" y="83"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="46" fontWeight="bold" fontStyle="italic"
          letterSpacing="-1.5" fill="#1C1917" textAnchor="middle"
        >BeDrawn</text>
        {/* Winner dot in stub */}
        <circle cx="341" cy="70" r="17" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
