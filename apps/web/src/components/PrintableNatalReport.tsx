import React, { useRef } from 'react';
import {
  Printer,
  X,
  Sparkles,
  Compass,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Layers,
  Award,
} from 'lucide-react';
import {
  type NatalChart,
  type AvakahadaDetails,
  type VimshottariDashaTree,
  type AshtakvargaResult,
  type ShadbalaResult,
  type ChalitChart,
  SIGNS,
  calculateVargaSign,
} from '@astro/engine';
import { NorthIndianChart, type ChartPlacement } from './NorthIndianChart.tsx';
import { SouthIndianChart } from './SouthIndianChart.tsx';

interface PrintableNatalReportProps {
  userName: string;
  cityName: string;
  birthDate: string;
  birthTime: string;
  tzId: string;
  lat: number;
  lon: number;
  ayanamsa: string;
  timeCertainty: string;
  natalChart: NatalChart;
  avakahada: AvakahadaDetails | null;
  dashas: VimshottariDashaTree | null;
  ashtakvarga: AshtakvargaResult | null;
  shadbala: ShadbalaResult | null;
  chalit: ChalitChart | null;
  panchang: any;
  onClose: () => void;
}

export const PrintableNatalReport: React.FC<PrintableNatalReportProps> = ({
  userName,
  cityName,
  birthDate,
  birthTime,
  tzId,
  lat,
  lon,
  ayanamsa,
  timeCertainty,
  natalChart,
  avakahada,
  dashas,
  ashtakvarga,
  shadbala,
  chalit,
  panchang,
  onClose,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const shortNames: Record<string, string> = {
    sun: 'Su',
    moon: 'Mo',
    mars: 'Ma',
    mercury: 'Me',
    jupiter: 'Ju',
    venus: 'Ve',
    saturn: 'Sa',
    rahu: 'Ra',
    ketu: 'Ke',
  };

  // Build D1 Placements
  const d1Placements: ChartPlacement[] = React.useMemo(() => {
    const map = new Map<number, ChartPlacement['items']>();
    for (let s = 0; s < 12; s++) map.set(s, []);

    if (natalChart.lagna) {
      map.get(natalChart.lagna.signIndex)?.push({
        label: 'Asc',
        isLagna: true,
      });
    }

    for (const [id, g] of Object.entries(natalChart.grahas)) {
      const label = shortNames[id] || id.slice(0, 2);
      map.get(g.signIndex)?.push({
        label,
        isRetrograde: g.retrograde,
      });
    }

    return Array.from(map.entries()).map(([signIndex, items]) => ({
      signIndex,
      items,
    }));
  }, [natalChart]);

  // Build D9 Navamsha Placements
  const d9Placements: ChartPlacement[] = React.useMemo(() => {
    if (!natalChart.lagna) return [];
    const map = new Map<number, ChartPlacement['items']>();
    for (let s = 0; s < 12; s++) map.set(s, []);

    const lagnaD9 = calculateVargaSign(natalChart.lagna.lon, 9);
    map.get(lagnaD9)?.push({
      label: 'Asc',
      isLagna: true,
    });

    for (const [id, g] of Object.entries(natalChart.grahas)) {
      if (!shortNames[id]) continue;
      const vSign = calculateVargaSign(g.lon, 9);
      map.get(vSign)?.push({
        label: shortNames[id]!,
        isRetrograde: g.retrograde,
      });
    }

    return Array.from(map.entries()).map(([signIndex, items]) => ({
      signIndex,
      items,
    }));
  }, [natalChart]);

  const d1LagnaSignIndex = natalChart.lagna ? natalChart.lagna.signIndex : 0;
  const d9LagnaSignIndex = natalChart.lagna ? calculateVargaSign(natalChart.lagna.lon, 9) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 8, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
        overflowY: 'auto',
      }}
      className="print:p-0 print:bg-white print:static print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '920px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0',
        }}
        className="print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:rounded-none"
      >
        {/* Floating Print & Close Controls (Screen only) */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card-bg/95 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold font-serif">Vedic Natal Horoscope Dossier</h2>
            <span className="badge badge-teal text-xs">A4 / Letter Ready</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn btn-primary text-xs flex items-center gap-2 px-4 py-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text rounded-lg hover:bg-card-bg/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div
          ref={reportRef}
          className="p-6 sm:p-10 space-y-8 bg-card-bg text-text print:bg-white print:text-black print:p-6 print:space-y-6"
        >
          {/* 1. Header Banner */}
          <div className="border-b-2 border-primary/40 pb-6 text-center print:border-black">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-gold print:text-black">
              VEDIC NATAL KUNDLI & DOSSIER
            </h1>
            <p className="text-xs uppercase tracking-widest text-text-muted print:text-gray-600 mt-1">
              Deterministic Sidereal Astrological Assessment • Swiss Ephemeris WASM Engine
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 rounded-xl bg-card-bg/50 border border-border/50 text-left print:bg-gray-50 print:border-gray-300 text-xs">
              <div>
                <span className="text-text-muted print:text-gray-500 block">Native Name:</span>
                <span className="font-semibold text-sm">{userName || 'Anonymous Native'}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Date of Birth:</span>
                <span className="font-semibold font-mono">{birthDate}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Time of Birth:</span>
                <span className="font-semibold font-mono">{birthTime} ({timeCertainty})</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Place of Birth:</span>
                <span className="font-semibold">{cityName}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Coordinates:</span>
                <span className="font-mono">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Timezone:</span>
                <span className="font-mono">{tzId}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Ayanamsa:</span>
                <span className="font-semibold capitalize">{ayanamsa.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-text-muted print:text-gray-500 block">Lagna (Ascendant):</span>
                <span className="font-semibold text-teal print:text-black">
                  {natalChart.lagna ? `${SIGNS[natalChart.lagna.signIndex]} (${(natalChart.lagna.lon % 30).toFixed(2)}°)` : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Panchang Blueprint */}
          {panchang && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-teal print:text-black flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Birth Panchang & Tithi
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Vara (Day):</span>
                  <span className="font-semibold">{panchang.vara}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Tithi:</span>
                  <span className="font-semibold">{panchang.tithi?.name || '—'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Nakshatra:</span>
                  <span className="font-semibold">{panchang.nakshatra?.name || '—'} (Pada {panchang.nakshatra?.pada || 1})</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Yoga:</span>
                  <span className="font-semibold">{panchang.yoga?.name || '—'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Karana:</span>
                  <span className="font-semibold">{panchang.karana?.name || '—'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                  <span className="text-text-muted print:text-gray-500 block text-[10px]">Moon Sign:</span>
                  <span className="font-semibold">{SIGNS[natalChart.grahas.moon.signIndex]}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. D1 Rashi & D9 Navamsha Charts Side by Side */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-gold print:text-black flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Kundli Charts (D1 Rashi & D9 Navamsha)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
              <div className="p-4 rounded-xl border border-border/60 bg-card-bg/30 text-center print:border-gray-300">
                <div className="text-xs font-semibold mb-2 text-teal print:text-black">
                  D1 Rashi Chart (Birth Lagna: {natalChart.lagna ? SIGNS[d1LagnaSignIndex] : 'Moon Lagna'})
                </div>
                <div className="max-w-[280px] mx-auto">
                  <NorthIndianChart
                    lagnaSignIndex={d1LagnaSignIndex}
                    placements={d1Placements}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card-bg/30 text-center print:border-gray-300">
                <div className="text-xs font-semibold mb-2 text-gold print:text-black">
                  D9 Navamsha Chart (Spouse, Dharma & Soul Potency)
                </div>
                <div className="max-w-[280px] mx-auto">
                  <NorthIndianChart
                    lagnaSignIndex={d9LagnaSignIndex}
                    placements={d9Placements}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Complete Planetary Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-teal print:text-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Planetary Positions & Dignities
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/60 print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-card-bg/80 print:bg-gray-100 text-[11px] uppercase tracking-wider text-text-muted print:text-gray-600 border-b border-border/40 print:border-gray-300">
                  <tr>
                    <th className="py-2.5 px-3">Graha</th>
                    <th className="py-2.5 px-3">Sign</th>
                    <th className="py-2.5 px-3">Nirayana Lon</th>
                    <th className="py-2.5 px-3">Nakshatra</th>
                    <th className="py-2.5 px-3">Pada</th>
                    <th className="py-2.5 px-3">Motion</th>
                    <th className="py-2.5 px-3">Combust</th>
                    <th className="py-2.5 px-3">Dignity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 print:divide-gray-200">
                  {natalChart.lagna && (
                    <tr className="bg-primary/5 font-medium print:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-teal print:text-black">Lagna (Asc)</td>
                      <td className="py-2 px-3">{SIGNS[natalChart.lagna.signIndex]}</td>
                      <td className="py-2 px-3 font-mono">{(natalChart.lagna.lon % 30).toFixed(2)}°</td>
                      <td className="py-2 px-3">Ashwini</td>
                      <td className="py-2 px-3">1</td>
                      <td className="py-2 px-3">Direct</td>
                      <td className="py-2 px-3">—</td>
                      <td className="py-2 px-3">Center Pivot</td>
                    </tr>
                  )}
                  {Object.entries(natalChart.grahas).map(([id, g]) => {
                    const deg = g.lon % 30;
                    const d = Math.floor(deg);
                    const m = Math.floor((deg - d) * 60);
                    return (
                      <tr key={id} className="hover:bg-card-bg/40">
                        <td className="py-2 px-3 font-semibold capitalize">{id}</td>
                        <td className="py-2 px-3">{SIGNS[g.signIndex]}</td>
                        <td className="py-2 px-3 font-mono">{d}° {m}&apos;</td>
                        <td className="py-2 px-3">{g.nakshatra}</td>
                        <td className="py-2 px-3 font-mono">{g.pada}</td>
                        <td className="py-2 px-3">
                          {g.retrograde ? (
                            <span className="text-amber font-semibold print:text-black">Retrograde (R)</span>
                          ) : (
                            'Direct'
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {g.combust ? (
                            <span className="text-red-400 font-semibold print:text-black">Combust (C)</span>
                          ) : (
                            'No'
                          )}
                        </td>
                        <td className="py-2 px-3 capitalize">{g.dignity?.replace('_', ' ') || 'Neutral'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Vimshottari Dasha Tree & Ashtakvarga in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ashtakvarga SAV Summary */}
            {ashtakvarga && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-gold print:text-black">
                  Sarva Ashtakvarga (SAV: 337 Bindus)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                  {SIGNS.map((s, idx) => {
                    const bindus = ashtakvarga.sarva[idx] ?? 28;
                    return (
                      <div
                        key={s}
                        className={`p-2 rounded-lg border ${
                          bindus >= 30
                            ? 'bg-teal/10 border-teal/40 font-bold print:bg-gray-100'
                            : bindus < 25
                            ? 'bg-amber/10 border-amber/40 font-medium print:bg-white'
                            : 'bg-card-bg/40 border-border/40 print:bg-white'
                        }`}
                      >
                        <div className="text-[10px] text-text-muted print:text-gray-500 uppercase">{s.slice(0, 3)}</div>
                        <div className="text-base font-serif font-bold mt-0.5">{bindus}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Avakahada Chakra */}
            {avakahada && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-teal print:text-black">
                  Avakahada Constitutional Chakra
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Varna</span>
                    <span className="font-semibold capitalize">{avakahada.varna}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Vashya</span>
                    <span className="font-semibold capitalize">{avakahada.vashya}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Yoni</span>
                    <span className="font-semibold capitalize">{avakahada.yoni}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Gana</span>
                    <span className="font-semibold capitalize">{avakahada.gana}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Nadi</span>
                    <span className="font-semibold capitalize">{avakahada.nadi}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-border/40 bg-card-bg/40 print:border-gray-200">
                    <span className="text-[10px] text-text-muted print:text-gray-500 block">Paya</span>
                    <span className="font-semibold capitalize">{avakahada.paya}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Vimshottari Mahadasha Lifeline */}
          {dashas && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-gold print:text-black flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Vimshottari Dasha Lifeline (120-Year Cycle)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {(dashas.periods || []).slice(0, 9).map((md) => {
                  const startYear = md.startDateIso ? new Date(md.startDateIso).getFullYear() : '—';
                  const endYear = md.endDateIso ? new Date(md.endDateIso).getFullYear() : '—';
                  const durYrs = md.durationDays ? Math.round((md.durationDays / 365.25) * 10) / 10 : '—';
                  return (
                    <div
                      key={md.lord}
                      className="p-2.5 rounded-lg border border-border/40 bg-card-bg/40 flex items-center justify-between print:border-gray-200"
                    >
                      <div>
                        <span className="font-semibold capitalize text-gold print:text-black">{md.lord}</span>
                        <span className="text-text-muted print:text-gray-500 ml-1.5">({durYrs} yrs)</span>
                      </div>
                      <div className="font-mono text-text-muted print:text-gray-600">
                        {startYear} - {endYear}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Signature */}
          <div className="pt-6 border-t border-border/40 text-center text-xs text-text-muted print:text-gray-500">
            Computed deterministically by <strong className="text-text print:text-black">MyAstro Engine</strong> using Swiss Ephemeris WASM • Free & Open Source Astrology Software
          </div>
        </div>
      </div>
    </div>
  );
};
