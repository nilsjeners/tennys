// Tennys brand mark — same artwork as apps/native/assets/images/tennys-logo.svg.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <clipPath id="tennysBallClip">
          <circle cx={200} cy={200} r={130} />
        </clipPath>
      </defs>
      <rect width={400} height={400} fill="#253F36" />
      <g clipPath="url(#tennysBallClip)">
        <rect width={400} height={400} fill="#A4BA25" />
        <circle cx={188} cy={188} r={130} fill="#C4D82D" />
        <circle cx={175} cy={175} r={115} fill="#DDF242" />
        <path d="M 50 155 C 130 210, 210 70, 340 130" fill="none" stroke="#253F36" strokeWidth={14} strokeLinecap="round" />
        <path d="M 60 280 C 190 330, 270 190, 350 245" fill="none" stroke="#253F36" strokeWidth={14} strokeLinecap="round" />
      </g>
    </svg>
  );
}
