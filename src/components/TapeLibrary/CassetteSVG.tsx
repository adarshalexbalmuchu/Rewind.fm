import type { CassetteStyle } from '../../lib/colorUtils';

interface Props {
  style: CassetteStyle;
}

export function CassetteSVG({ style }: Props) {
  if (style === 'yellow-black') {
    return (
      <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="82" rx="5" fill="#1a1a0a" />
        <rect x="4" y="4" width="122" height="74" rx="4" fill="#f0c010" />
        <rect x="8" y="8" width="114" height="44" rx="3" fill="#1a1a0a" />
        <circle cx="32" cy="54" r="12" fill="#1a1a0a" stroke="#f0c010" strokeWidth="1.5" />
        <circle cx="32" cy="54" r="6" fill="#f0c010" />
        <circle cx="32" cy="54" r="3" fill="#1a1a0a" />
        <circle cx="98" cy="54" r="12" fill="#1a1a0a" stroke="#f0c010" strokeWidth="1.5" />
        <circle cx="98" cy="54" r="6" fill="#f0c010" />
        <circle cx="98" cy="54" r="3" fill="#1a1a0a" />
        <rect x="44" y="48" width="42" height="14" rx="2" fill="#1a1a0a" stroke="#f0c010" strokeWidth="1" />
        <line x1="44" y1="55" x2="86" y2="55" stroke="#f0c010" strokeWidth="0.8" />
        <rect x="10" y="10" width="110" height="38" rx="2" fill="#0a0a00" opacity="0.6" />
        <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#f0c010" strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }

  if (style === 'cream-black') {
    return (
      <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="82" rx="5" fill="#ede0c0" />
        <rect x="4" y="4" width="122" height="74" rx="4" fill="#c8b880" />
        <rect x="8" y="8" width="114" height="44" rx="3" fill="#1a1608" />
        <circle cx="32" cy="54" r="12" fill="#1a1608" stroke="#ede0c0" strokeWidth="1.5" />
        <circle cx="32" cy="54" r="6" fill="#ede0c0" />
        <circle cx="32" cy="54" r="3" fill="#1a1608" />
        <circle cx="98" cy="54" r="12" fill="#1a1608" stroke="#ede0c0" strokeWidth="1.5" />
        <circle cx="98" cy="54" r="6" fill="#ede0c0" />
        <circle cx="98" cy="54" r="3" fill="#1a1608" />
        <rect x="44" y="48" width="42" height="14" rx="2" fill="#1a1608" stroke="#ede0c0" strokeWidth="1" />
        <line x1="44" y1="55" x2="86" y2="55" stroke="#ede0c0" strokeWidth="0.8" />
        <rect x="10" y="10" width="110" height="38" rx="2" fill="#0a0800" opacity="0.5" />
        <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#ede0c0" strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }

  if (style === 'grey-red') {
    return (
      <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="82" rx="5" fill="#5a5a5a" />
        <rect x="4" y="4" width="122" height="74" rx="4" fill="#888888" />
        <rect x="8" y="8" width="114" height="44" rx="3" fill="#1a0808" />
        <circle cx="32" cy="54" r="12" fill="#1a0808" stroke="#cc2010" strokeWidth="1.5" />
        <circle cx="32" cy="54" r="6" fill="#cc2010" />
        <circle cx="32" cy="54" r="3" fill="#1a0808" />
        <circle cx="98" cy="54" r="12" fill="#1a0808" stroke="#cc2010" strokeWidth="1.5" />
        <circle cx="98" cy="54" r="6" fill="#cc2010" />
        <circle cx="98" cy="54" r="3" fill="#1a0808" />
        <rect x="44" y="48" width="42" height="14" rx="2" fill="#1a0808" stroke="#cc2010" strokeWidth="1" />
        <line x1="44" y1="55" x2="86" y2="55" stroke="#cc2010" strokeWidth="0.8" />
        <rect x="10" y="10" width="110" height="38" rx="2" fill="#080000" opacity="0.6" />
        <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#cc2010" strokeWidth="0.5" opacity="0.5" />
      </svg>
    );
  }

  if (style === 'amber-brown') {
    return (
      <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="82" rx="5" fill="#4a3010" />
        <rect x="4" y="4" width="122" height="74" rx="4" fill="#8a6030" />
        <rect x="8" y="8" width="114" height="44" rx="3" fill="#1a1008" />
        <circle cx="32" cy="54" r="12" fill="#1a1008" stroke="#c8a858" strokeWidth="1.5" />
        <circle cx="32" cy="54" r="6" fill="#c8a858" />
        <circle cx="32" cy="54" r="3" fill="#1a1008" />
        <circle cx="98" cy="54" r="12" fill="#1a1008" stroke="#c8a858" strokeWidth="1.5" />
        <circle cx="98" cy="54" r="6" fill="#c8a858" />
        <circle cx="98" cy="54" r="3" fill="#1a1008" />
        <rect x="44" y="48" width="42" height="14" rx="2" fill="#1a1008" stroke="#c8a858" strokeWidth="1" />
        <line x1="44" y1="55" x2="86" y2="55" stroke="#c8a858" strokeWidth="0.8" />
        <rect x="10" y="10" width="110" height="38" rx="2" fill="#080400" opacity="0.6" />
        <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#c8a858" strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }

  if (style === 'navy-blue') {
    return (
      <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="82" rx="5" fill="#0a1428" />
        <rect x="4" y="4" width="122" height="74" rx="4" fill="#1a2848" />
        <rect x="8" y="8" width="114" height="44" rx="3" fill="#060c18" />
        <circle cx="32" cy="54" r="12" fill="#060c18" stroke="#1848b8" strokeWidth="1.5" />
        <circle cx="32" cy="54" r="6" fill="#1848b8" />
        <circle cx="32" cy="54" r="3" fill="#060c18" />
        <circle cx="98" cy="54" r="12" fill="#060c18" stroke="#1848b8" strokeWidth="1.5" />
        <circle cx="98" cy="54" r="6" fill="#1848b8" />
        <circle cx="98" cy="54" r="3" fill="#060c18" />
        <rect x="44" y="48" width="42" height="14" rx="2" fill="#060c18" stroke="#1848b8" strokeWidth="1" />
        <line x1="44" y1="55" x2="86" y2="55" stroke="#1848b8" strokeWidth="0.8" />
        <rect x="10" y="10" width="110" height="38" rx="2" fill="#020408" opacity="0.7" />
        <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#1848b8" strokeWidth="0.5" opacity="0.5" />
      </svg>
    );
  }

  // green-black
  return (
    <svg viewBox="0 0 130 82" width="66" height="42" xmlns="http://www.w3.org/2000/svg">
      <rect width="130" height="82" rx="5" fill="#0a1a0a" />
      <rect x="4" y="4" width="122" height="74" rx="4" fill="#1a3818" />
      <rect x="8" y="8" width="114" height="44" rx="3" fill="#060e06" />
      <circle cx="32" cy="54" r="12" fill="#060e06" stroke="#2aaa30" strokeWidth="1.5" />
      <circle cx="32" cy="54" r="6" fill="#2aaa30" />
      <circle cx="32" cy="54" r="3" fill="#060e06" />
      <circle cx="98" cy="54" r="12" fill="#060e06" stroke="#2aaa30" strokeWidth="1.5" />
      <circle cx="98" cy="54" r="6" fill="#2aaa30" />
      <circle cx="98" cy="54" r="3" fill="#060e06" />
      <rect x="44" y="48" width="42" height="14" rx="2" fill="#060e06" stroke="#2aaa30" strokeWidth="1" />
      <line x1="44" y1="55" x2="86" y2="55" stroke="#2aaa30" strokeWidth="0.8" />
      <rect x="10" y="10" width="110" height="38" rx="2" fill="#020402" opacity="0.7" />
      <rect x="14" y="14" width="102" height="16" rx="1" fill="none" stroke="#2aaa30" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}
