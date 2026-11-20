import type { Finding, HouseReadingSummary, NetToneLabel } from './schema.js';

export function aggregateByHouse(findings: Finding[]): Record<number, HouseReadingSummary> {
  const byHouse: Record<number, HouseReadingSummary> = {};

  for (let h = 1; h <= 12; h++) {
    const houseFindings = findings
      .filter((f) => f.house === h)
      .sort((a, b) => b.strength - a.strength);

    const supportiveTop = houseFindings.filter((f) => f.polarity === 'supportive');
    const challengingTop = houseFindings.filter((f) => f.polarity === 'challenging');

    let netScore = 0;
    for (const f of houseFindings) {
      if (f.polarity === 'supportive') netScore += f.strength;
      else if (f.polarity === 'challenging') netScore -= f.strength;
    }

    const hasStrongSupportive = supportiveTop.some((f) => f.strength >= 50);
    const hasStrongChallenging = challengingTop.some((f) => f.strength >= 50);

    let tone: NetToneLabel;
    if (houseFindings.length === 0) {
      tone = 'Quiet';
    } else if (hasStrongSupportive && hasStrongChallenging) {
      tone = 'Mixed';
    } else if (netScore >= 20) {
      tone = 'Mostly supportive';
    } else if (netScore <= -20) {
      tone = 'Needs attention';
    } else {
      tone = 'Mixed';
    }

    byHouse[h] = {
      house: h,
      tone,
      netScore,
      findings: houseFindings,
      supportiveTop,
      challengingTop,
    };
  }

  return byHouse;
}

export function aggregateByTheme(findings: Finding[]): Record<string, Finding[]> {
  const map: Record<string, Finding[]> = {};
  for (const f of findings) {
    if (!map[f.theme]) map[f.theme] = [];
    map[f.theme]!.push(f);
  }
  for (const k of Object.keys(map)) {
    map[k]!.sort((a, b) => b.strength - a.strength);
  }
  return map;
}
