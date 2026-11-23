import { norm360, signOf } from '../angles.js';
import type { GrahaName } from '../natal/types.js';

export const VARGA_TYPES = [
  'D1',
  'D2',
  'D3',
  'D4',
  'D7',
  'D9',
  'D10',
  'D12',
  'D16',
  'D20',
  'D24',
  'D27',
  'D30',
  'D40',
  'D45',
  'D60',
] as const;

export type VargaType = (typeof VARGA_TYPES)[number];

export const VARGA_LABELS: Record<VargaType, string> = {
  D1: 'D1 Rashi (Birth Horoscope)',
  D2: 'D2 Hora (Wealth & Prosperity)',
  D3: 'D3 Drekkana (Siblings & Energy)',
  D4: 'D4 Chaturthamsha (Luck & Fixed Assets)',
  D7: 'D7 Saptamamsha (Children & Progeny)',
  D9: 'D9 Navamsha (Dharma, Spouse & Destiny)',
  D10: 'D10 Dashamamsha (Profession & Status)',
  D12: 'D12 Dwadashamamsha (Parents & Lineage)',
  D16: 'D16 Shodashamsha (Vehicles & Pleasures)',
  D20: 'D20 Vimshamsha (Spiritual Pursuits)',
  D24: 'D24 Chaturvimshamsha (Learning & Knowledge)',
  D27: 'D27 Saptavimshamsha (Strengths & Weaknesses)',
  D30: 'D30 Trimshamsha (Misfortune & Evils)',
  D40: 'D40 Khavedamsha (Auspicious / Inauspicious Effects)',
  D45: 'D45 Akshavedamsha (General Well-Being & Character)',
  D60: 'D60 Shashtiamsha (Past Karma & Fine Destiny)',
};

export interface VargaPlacement {
  varga: VargaType;
  graha: GrahaName | 'lagna';
  sign: string;
  signIndex: number; // 0 = aries, 1 = taurus, ...
  houseFromLagna: number; // 1-12
}

/**
 * Calculates Divisional Chart (Varga) sign placement according to classical Parashara rules.
 * @param lon Sidereal longitude in decimal degrees [0, 360)
 * @param varga The divisional chart type
 */
export const calculateVargaSign = (lon: number, varga: VargaType): number => {
  const normLon = norm360(lon);
  const signIndex = Math.floor(normLon / 30); // 0..11
  const degInSign = normLon - signIndex * 30; // 0..30
  const isOddSign = signIndex % 2 === 0; // Aries = 0 (odd in astrology, 1st sign)
  const modality = signIndex % 3; // 0 = Movable, 1 = Fixed, 2 = Dual
  const triplicity = signIndex % 4; // 0 = Fire, 1 = Earth, 2 = Air, 3 = Water

  switch (varga) {
    case 'D1': // Rashi
      return signIndex;

    case 'D2': {
      // Hora (2 parts of 15° each)
      // Odd signs: 1st half Sun (Leo = 4), 2nd half Moon (Cancer = 3)
      // Even signs: 1st half Moon (Cancer = 3), 2nd half Sun (Leo = 4)
      const part = Math.floor(degInSign / 15);
      if (isOddSign) {
        return part === 0 ? 4 : 3;
      } else {
        return part === 0 ? 3 : 4;
      }
    }

    case 'D3': {
      // Drekkana (3 parts of 10° each)
      // 1st part: same sign (1st), 2nd: 5th from it (+4), 3rd: 9th from it (+8)
      const part = Math.min(2, Math.floor(degInSign / 10));
      const offset = part === 0 ? 0 : part === 1 ? 4 : 8;
      return (signIndex + offset) % 12;
    }

    case 'D4': {
      // Chaturthamsha (4 parts of 7°30' each)
      // 1st: same, 2nd: 4th (+3), 3rd: 7th (+6), 4th: 10th (+9)
      const part = Math.min(3, Math.floor(degInSign / 7.5));
      return (signIndex + part * 3) % 12;
    }

    case 'D7': {
      // Saptamsha (7 parts of 4°17'08.57" each = 30/7)
      // Odd signs: start from same sign
      // Even signs: start from 7th sign (+6)
      const part = Math.min(6, Math.floor(degInSign / (30 / 7)));
      const startSign = isOddSign ? signIndex : (signIndex + 6) % 12;
      return (startSign + part) % 12;
    }

    case 'D9': {
      // Navamsha (9 parts of 3°20' each)
      // Movable signs: start from same sign (0)
      // Fixed signs: start from 9th sign (+8)
      // Dual signs: start from 5th sign (+4)
      const part = Math.min(8, Math.floor(degInSign / (30 / 9)));
      let startOffset = 0;
      if (modality === 0) startOffset = 0;
      else if (modality === 1) startOffset = 8;
      else startOffset = 4;

      return (signIndex + startOffset + part) % 12;
    }

    case 'D10': {
      // Dashamsha (10 parts of 3° each)
      // Odd signs: start from same sign
      // Even signs: start from 9th sign (+8)
      const part = Math.min(9, Math.floor(degInSign / 3));
      const startSign = isOddSign ? signIndex : (signIndex + 8) % 12;
      return (startSign + part) % 12;
    }

    case 'D12': {
      // Dwadashamsha (12 parts of 2°30' each = 2.5°)
      // Starts from same sign and counts sequentially
      const part = Math.min(11, Math.floor(degInSign / 2.5));
      return (signIndex + part) % 12;
    }

    case 'D16': {
      // Shodashamsha (16 parts of 1°52'30" = 1.875°)
      // Movable: start from Aries (0)
      // Fixed: start from Leo (4)
      // Dual: start from Sagittarius (8)
      const part = Math.min(15, Math.floor(degInSign / 1.875));
      const startSign = modality === 0 ? 0 : modality === 1 ? 4 : 8;
      return (startSign + part) % 12;
    }

    case 'D20': {
      // Vimshamsha (20 parts of 1°30' = 1.5°)
      // Movable: start from Aries (0)
      // Fixed: start from Sagittarius (8)
      // Dual: start from Leo (4)
      const part = Math.min(19, Math.floor(degInSign / 1.5));
      const startSign = modality === 0 ? 0 : modality === 1 ? 8 : 4;
      return (startSign + part) % 12;
    }

    case 'D24': {
      // Chaturvimshamsha (24 parts of 1°15' = 1.25°)
      // Odd signs: start from Leo (4)
      // Even signs: start from Cancer (3)
      const part = Math.min(23, Math.floor(degInSign / 1.25));
      const startSign = isOddSign ? 4 : 3;
      return (startSign + part) % 12;
    }

    case 'D27': {
      // Saptavimshamsha / Bhamsa (27 parts of 1°06'40" = 30/27)
      // Fire: start from Aries (0)
      // Earth: start from Cancer (3)
      // Air: start from Libra (6)
      // Water: start from Capricorn (9)
      const part = Math.min(26, Math.floor(degInSign / (30 / 27)));
      const startSign = triplicity === 0 ? 0 : triplicity === 1 ? 3 : triplicity === 2 ? 6 : 9;
      return (startSign + part) % 12;
    }

    case 'D30': {
      // Trimshamsha (5 unequal parts)
      // Odd signs:
      //   0°-5°: Mars (Aries=0)
      //   5°-10°: Saturn (Aquarius=10)
      //   10°-18°: Jupiter (Sagittarius=8)
      //   18°-25°: Mercury (Gemini=2)
      //   25°-30°: Venus (Libra=6)
      // Even signs:
      //   0°-5°: Venus (Taurus=1)
      //   5°-12°: Mercury (Virgo=5)
      //   12°-20°: Jupiter (Pisces=11)
      //   20°-25°: Saturn (Capricorn=9)
      //   25°-30°: Mars (Scorpio=7)
      if (isOddSign) {
        if (degInSign < 5) return 0;
        if (degInSign < 10) return 10;
        if (degInSign < 18) return 8;
        if (degInSign < 25) return 2;
        return 6;
      } else {
        if (degInSign < 5) return 1;
        if (degInSign < 12) return 5;
        if (degInSign < 20) return 11;
        if (degInSign < 25) return 9;
        return 7;
      }
    }

    case 'D40': {
      // Khavedamsha (40 parts of 45' = 0.75°)
      // Odd signs: start from Aries (0)
      // Even signs: start from Libra (6)
      const part = Math.min(39, Math.floor(degInSign / 0.75));
      const startSign = isOddSign ? 0 : 6;
      return (startSign + part) % 12;
    }

    case 'D45': {
      // Akshavedamsha (45 parts of 40' = 30/45 = 2/3°)
      // Movable: start from Aries (0)
      // Fixed: start from Leo (4)
      // Dual: start from Sagittarius (8)
      const part = Math.min(44, Math.floor(degInSign / (30 / 45)));
      const startSign = modality === 0 ? 0 : modality === 1 ? 4 : 8;
      return (startSign + part) % 12;
    }

    case 'D60': {
      // Shashtiamsha (60 parts of 30' = 0.5°)
      // BPHS Ch. 6, Verses 33-34: count from Aries (0) irrespective of the sign
      const part = Math.min(59, Math.floor(degInSign / 0.5));
      return part % 12;
    }

    default:
      return signIndex;
  }
};
