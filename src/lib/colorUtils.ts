export type CassetteStyle = 'yellow-black' | 'cream-black' | 'grey-red' | 'amber-brown' | 'navy-blue' | 'green-black';

const STYLE_SEQUENCE: CassetteStyle[] = ['yellow-black', 'cream-black', 'grey-red', 'amber-brown', 'navy-blue', 'green-black'];

export function getCassetteStyle(index: number): CassetteStyle {
  return STYLE_SEQUENCE[index % STYLE_SEQUENCE.length];
}

export function getLabelColor(style: CassetteStyle): string {
  const map: Record<CassetteStyle, string> = {
    'yellow-black': '#f0c010',
    'cream-black': '#ede0c0',
    'grey-red': '#cc2010',
    'amber-brown': '#c8a858',
    'navy-blue': '#1848b8',
    'green-black': '#2aaa30',
  };
  return map[style];
}
