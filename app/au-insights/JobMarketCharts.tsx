'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  IVI_QUARTERLY, IVI_BY_STATE,
  SALARIES_BY_ROLE,
  GRAD_EMPLOYMENT, GRAD_BY_FIELD,
  JSA_ICT_OCCUPATIONS,
  type ShortageStatus,
} from './data/job-market';
import DigitalPulseCard from './DigitalPulseCard';

/* ─── responsive width hook ─────────────────────────────────────────── */
function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(e => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ─── shared label ──────────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', marginTop: 0 }}>
      {children}
    </p>
  );
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.6rem',
      lineHeight: 1.55, borderTop: '1px solid var(--parchment)', paddingTop: '0.5rem' }}>
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   1. ABS IVI — vacancy index line chart
   ══════════════════════════════════════════════════════════════════════ */
function IVILineChart() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const H = 220, MT = 20, MB = 30, ML = 40, MR = 12;
  const iW = w - ML - MR, iH = H - MT - MB;

  const [tooltip, setTooltip] = useState<{ x: number; y: number; d: typeof IVI_QUARTERLY[0] } | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);
    const pts = IVI_QUARTERLY;

    const xScale = d3.scalePoint<string>()
      .domain(pts.map(d => d.quarter))
      .range([0, iW]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(pts, d => Math.max(d.ict, d.all))! * 1.1])
      .range([iH, 0]);

    // grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-iW).tickFormat(() => ''))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('line').attr('stroke', '#e5e7eb').attr('stroke-dasharray', '2,3'); });

    // axes
    const every = Math.ceil(pts.length / (w < 480 ? 4 : 6));
    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues(pts.filter((_, i) => i % every === 0).map(d => d.quarter)))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => String(d)))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    // COVID annotation
    const covidQ = 'Q2 2020';
    const cx = xScale(covidQ);
    if (cx !== undefined) {
      g.append('line').attr('x1', cx).attr('x2', cx).attr('y1', 0).attr('y2', iH)
        .attr('stroke', '#f59e0b').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
      g.append('text').attr('x', cx + 3).attr('y', 14)
        .style('font-size', '0.6rem').attr('fill', '#f59e0b').text('COVID');
    }
    // peak annotation
    const peakQ = 'Q2 2022';
    const px = xScale(peakQ);
    if (px !== undefined) {
      g.append('text').attr('x', px - 24).attr('y', yScale(191) - 5)
        .style('font-size', '0.6rem').attr('fill', '#dc2626').text('Peak');
    }

    // line + area generators
    const lineICT = d3.line<typeof pts[0]>().x(d => xScale(d.quarter)!).y(d => yScale(d.ict)).curve(d3.curveCatmullRom);
    const lineAll = d3.line<typeof pts[0]>().x(d => xScale(d.quarter)!).y(d => yScale(d.all)).curve(d3.curveCatmullRom);
    const areaICT = d3.area<typeof pts[0]>().x(d => xScale(d.quarter)!).y0(iH).y1(d => yScale(d.ict)).curve(d3.curveCatmullRom);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'ivi-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#dc2626').attr('stop-opacity', 0.18);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626').attr('stop-opacity', 0);

    g.append('path').datum(pts).attr('d', areaICT).attr('fill', 'url(#ivi-grad)');
    g.append('path').datum(pts).attr('d', lineAll).attr('fill', 'none').attr('stroke', '#d1d5db').attr('stroke-width', 1.5);
    g.append('path').datum(pts).attr('d', lineICT).attr('fill', 'none').attr('stroke', '#dc2626').attr('stroke-width', 2);

    // hover overlay
    const bisect = d3.bisector((d: typeof pts[0]) => d.quarter).left;
    const overlay = g.append('rect').attr('width', iW).attr('height', iH).attr('fill', 'none').attr('pointer-events', 'all');

    overlay.on('mousemove', (event: MouseEvent) => {
      const [mx] = d3.pointer(event);
      const domain = pts.map(d => d.quarter);
      const step = iW / (domain.length - 1);
      const idx = Math.min(Math.round(mx / step), domain.length - 1);
      const d = pts[Math.max(0, idx)];
      setTooltip({ x: xScale(d.quarter)! + ML, y: MT + 10, d });
    }).on('mouseleave', () => setTooltip(null));

  }, [w]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ width: '100%' }}>
        <svg width={w} height={H} />
      </div>
      {tooltip && (
        <div style={{
          position: 'absolute', left: Math.min(tooltip.x, w - 160), top: tooltip.y,
          background: 'white', border: '1px solid var(--parchment)', borderRadius: '8px',
          padding: '0.5rem 0.75rem', fontSize: '0.75rem', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10,
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{tooltip.d.quarter}</div>
          <div style={{ color: '#dc2626' }}>ICT: <strong>{tooltip.d.ict}</strong></div>
          <div style={{ color: '#9ca3af' }}>All: <strong>{tooltip.d.all}</strong></div>
          {tooltip.d.est && <div style={{ color: '#d97706', fontSize: '0.67rem', marginTop: '0.2rem' }}>* estimated</div>}
        </div>
      )}
      {/* legend */}
      <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.4rem', paddingLeft: `${40}px` }}>
        {[['ICT Professionals', '#dc2626'], ['All Occupations', '#d1d5db']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 20, height: 2, background: color as string }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   2. IVI by State bar chart
   ══════════════════════════════════════════════════════════════════════ */
function IVIStateChart() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const H = 180, MT = 10, MB = 30, ML = 40, MR = 70;
  const iW = w - ML - MR, iH = H - MT - MB;

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);
    const data = IVI_BY_STATE;

    const xScale = d3.scaleBand().domain(data.map(d => d.state)).range([0, iW]).padding(0.25);
    const yScale = d3.scaleLinear().domain([0, 160]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call(gx => { gx.select('.domain').attr('stroke', '#e5e7eb'); gx.selectAll('text').style('font-size', '0.7rem').attr('fill', '#6b7280'); });

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    // 100 baseline
    g.append('line').attr('x1', 0).attr('x2', iW).attr('y1', yScale(100)).attr('y2', yScale(100))
      .attr('stroke', '#d97706').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    g.append('text').attr('x', iW + 3).attr('y', yScale(100) + 4).style('font-size', '0.6rem').attr('fill', '#d97706').text('Base');

    g.selectAll('.bar').data(data).join('rect')
      .attr('x', d => xScale(d.state)!)
      .attr('y', d => yScale(d.index))
      .attr('width', xScale.bandwidth())
      .attr('height', d => iH - yScale(d.index))
      .attr('rx', 3)
      .attr('fill', d => d.index >= 120 ? '#dc2626' : d.index >= 100 ? '#d97706' : '#9ca3af');

    // change labels
    g.selectAll('.lbl').data(data).join('text')
      .attr('x', d => xScale(d.state)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.index) - 3)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.6rem')
      .attr('fill', d => d.change < 0 ? '#6b7280' : '#10b981')
      .text(d => `${d.change > 0 ? '+' : ''}${d.change}%`);

  }, [w]);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={H} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   3. Salary by Role — horizontal grouped bar
   ══════════════════════════════════════════════════════════════════════ */
function SalaryChart() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const barH = 22, gap = 6;
  const roles = SALARIES_BY_ROLE;
  const H = roles.length * (barH * 3 + gap + 10) + 40;
  const ML = w < 480 ? 100 : 160, MR = 50, MT = 20, MB = 10;
  const iW = w - ML - MR;

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);

    const maxSal = d3.max(roles, d => d.senior)!;
    const xScale = d3.scaleLinear().domain([0, maxSal]).range([0, iW]);
    const colors = { junior: '#93c5fd', mid: '#3b82f6', senior: '#1d4ed8' };
    const keys = ['junior', 'mid', 'senior'] as const;
    const labels = { junior: 'Junior', mid: 'Mid', senior: 'Senior' };

    roles.forEach((role, ri) => {
      const rowY = ri * (barH * 3 + gap + 10);
      // role label
      g.append('text').attr('x', -8).attr('y', rowY + barH * 1.5)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .style('font-size', w < 480 ? '0.62rem' : '0.72rem').attr('fill', '#374151').text(role.role);

      keys.forEach((k, ki) => {
        const val = role[k];
        g.append('rect')
          .attr('x', 0).attr('y', rowY + ki * (barH))
          .attr('width', xScale(val)).attr('height', barH - 2).attr('rx', 3)
          .attr('fill', colors[k]).attr('opacity', 0.85);
        g.append('text').attr('x', xScale(val) + 4).attr('y', rowY + ki * barH + barH / 2)
          .attr('dominant-baseline', 'middle').style('font-size', '0.62rem').attr('fill', '#374151')
          .text(`$${val}k`);
      });
    });

    // x-axis
    g.append('g').attr('transform', `translate(0,${H - MT - MB})`)
      .call(d3.axisBottom(xScale).ticks(4).tickFormat(d => `$${d}k`))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    // legend
    const lg = svg.append('g').attr('transform', `translate(${ML},6)`);
    keys.forEach((k, i) => {
      lg.append('rect').attr('x', i * 70).attr('y', 0).attr('width', 12).attr('height', 8).attr('rx', 2).attr('fill', colors[k]);
      lg.append('text').attr('x', i * 70 + 16).attr('y', 7).style('font-size', '0.65rem').attr('fill', '#6b7280').text(labels[k]);
    });

  }, [w]);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={H} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   4. QILT Grad Employment — line chart
   ══════════════════════════════════════════════════════════════════════ */
function GradEmploymentChart() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const H = 200, MT = 20, MB = 30, ML = 38, MR = 12;
  const iW = w - ML - MR, iH = H - MT - MB;

  const [tooltip, setTooltip] = useState<{ x: number; y: number; d: typeof GRAD_EMPLOYMENT[0] } | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);
    const pts = GRAD_EMPLOYMENT;

    const xScale = d3.scalePoint<number>().domain(pts.map(d => d.year)).range([0, iW]);
    const yScale = d3.scaleLinear().domain([55, 95]).range([iH, 0]);

    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`).tickSize(-iW))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('line').attr('stroke', '#e5e7eb').attr('stroke-dasharray', '2,3'); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); });

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickFormat(d => String(d)))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    // COVID annotation
    const covidX = xScale(2020);
    if (covidX !== undefined) {
      g.append('line').attr('x1', covidX).attr('x2', covidX).attr('y1', 0).attr('y2', iH)
        .attr('stroke', '#f59e0b').attr('stroke-dasharray', '3,3').attr('stroke-width', 1);
    }

    const lineIT = d3.line<typeof pts[0]>().x(d => xScale(d.year)!).y(d => yScale(d.it_rate)).curve(d3.curveCatmullRom);
    const lineAll = d3.line<typeof pts[0]>().x(d => xScale(d.year)!).y(d => yScale(d.all_rate)).curve(d3.curveCatmullRom);
    const areaIT = d3.area<typeof pts[0]>().x(d => xScale(d.year)!).y0(iH).y1(d => yScale(d.it_rate)).curve(d3.curveCatmullRom);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'grad-grad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#7c3aed').attr('stop-opacity', 0.15);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed').attr('stop-opacity', 0);

    g.append('path').datum(pts).attr('d', areaIT).attr('fill', 'url(#grad-grad)');
    g.append('path').datum(pts).attr('d', lineAll).attr('fill', 'none').attr('stroke', '#d1d5db').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,2');
    g.append('path').datum(pts).attr('d', lineIT).attr('fill', 'none').attr('stroke', '#7c3aed').attr('stroke-width', 2);

    // dots
    g.selectAll('.dot').data(pts).join('circle')
      .attr('cx', d => xScale(d.year)!).attr('cy', d => yScale(d.it_rate))
      .attr('r', 4).attr('fill', '#7c3aed').attr('stroke', 'white').attr('stroke-width', 1.5);

    const overlay = g.append('rect').attr('width', iW).attr('height', iH).attr('fill', 'none').attr('pointer-events', 'all');
    overlay.on('mousemove', (event: MouseEvent) => {
      const [mx] = d3.pointer(event);
      const step = iW / (pts.length - 1);
      const idx = Math.min(Math.round(mx / step), pts.length - 1);
      const d = pts[Math.max(0, idx)];
      setTooltip({ x: xScale(d.year)! + ML, y: MT + 10, d });
    }).on('mouseleave', () => setTooltip(null));

  }, [w]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ width: '100%' }}>
        <svg width={w} height={H} />
      </div>
      {tooltip && (
        <div style={{
          position: 'absolute', left: Math.min(tooltip.x, w - 180), top: tooltip.y,
          background: 'white', border: '1px solid var(--parchment)', borderRadius: '8px',
          padding: '0.5rem 0.75rem', fontSize: '0.75rem', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10,
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{tooltip.d.year}</div>
          <div style={{ color: '#7c3aed' }}>IT Employment: <strong>{tooltip.d.it_rate}%</strong></div>
          <div style={{ color: '#9ca3af' }}>All fields: <strong>{tooltip.d.all_rate}%</strong></div>
          <div style={{ color: '#374151', marginTop: '0.2rem' }}>IT Median salary: <strong>${(tooltip.d.it_salary / 1000).toFixed(0)}k</strong></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.4rem', paddingLeft: `${38}px` }}>
        {[['IT / CS Graduates', '#7c3aed', false], ['All Disciplines', '#d1d5db', true]].map(([label, color, dashed]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke={color as string} strokeWidth="2" strokeDasharray={dashed ? '4,2' : undefined} /></svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   5. QILT by Field comparison — grouped bar
   ══════════════════════════════════════════════════════════════════════ */
function GradFieldChart() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const H = 200, MT = 10, MB = 60, ML = 10, MR = 10;
  const iW = w - ML - MR, iH = H - MT - MB;

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);
    const data = GRAD_BY_FIELD;

    const xScale = d3.scaleBand().domain(data.map(d => d.field)).range([0, iW]).padding(0.2);
    const yScale = d3.scaleLinear().domain([0, 100]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call(gx => {
        gx.select('.domain').attr('stroke', '#e5e7eb');
        gx.selectAll('text').style('font-size', '0.62rem').attr('fill', '#6b7280')
          .attr('transform', 'rotate(-35)').attr('text-anchor', 'end');
      });

    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('text').style('font-size', '0.65rem').attr('fill', '#9ca3af'); gx.selectAll('line').remove(); });

    g.selectAll('.bar').data(data).join('rect')
      .attr('x', d => xScale(d.field)!)
      .attr('y', d => yScale(d.rate))
      .attr('width', xScale.bandwidth())
      .attr('height', d => iH - yScale(d.rate))
      .attr('rx', 3).attr('fill', d => d.color).attr('opacity', 0.85);

    g.selectAll('.lbl').data(data).join('text')
      .attr('x', d => xScale(d.field)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.rate) - 3)
      .attr('text-anchor', 'middle').style('font-size', '0.6rem').attr('fill', '#374151')
      .text(d => `${d.rate}%`);

  }, [w]);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={H} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   6. JSA Skills Matrix — CSS grid (no D3 needed)
   ══════════════════════════════════════════════════════════════════════ */
const STATUS_COLOR: Record<ShortageStatus, { bg: string; text: string; label: string }> = {
  Shortage:  { bg: '#fef2f2', text: '#dc2626', label: 'Shortage' },
  Regional:  { bg: '#fffbeb', text: '#d97706', label: 'Regional' },
  Balanced:  { bg: '#f0fdf4', text: '#16a34a', label: 'Balanced' },
  Surplus:   { bg: '#f9fafb', text: '#6b7280', label: 'Surplus' },
  NA:        { bg: '#f9fafb', text: '#d1d5db', label: '—' },
};

function JSAMatrix() {
  const years = ['2022', '2023', '2024'] as const;
  const statusKey = { '2022': 'status2022', '2023': 'status2023', '2024': 'status2024' } as const;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--parchment)' }}>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 160 }}>Role</th>
            {years.map(y => (
              <th key={y} style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 72 }}>{y}</th>
            ))}
            <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 64 }}>Salary</th>
          </tr>
        </thead>
        <tbody>
          {JSA_ICT_OCCUPATIONS.map((occ, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--parchment)', background: i % 2 === 0 ? 'transparent' : '#faf9f7' }}>
              <td style={{ padding: '0.45rem 0.5rem', color: 'var(--brown-dark)', fontWeight: 500 }}>
                {occ.role}
                {occ.note && <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 400 }}>{occ.note}</span>}
              </td>
              {years.map(y => {
                const s = occ[statusKey[y]];
                const c = STATUS_COLOR[s];
                return (
                  <td key={y} style={{ padding: '0.3rem 0.4rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.15rem 0.45rem', borderRadius: '99px',
                      background: c.bg, color: c.text, fontWeight: 600, fontSize: '0.65rem',
                      border: `1px solid ${c.text}25`,
                    }}>
                      {c.label}
                    </span>
                  </td>
                );
              })}
              <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#374151', fontWeight: 500 }}>
                ${(occ.salary / 1000).toFixed(0)}k
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   7. JSA Bubble — shortage level vs salary
   ══════════════════════════════════════════════════════════════════════ */
function JSABubble() {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const H = 240, MT = 30, MB = 50, ML = 55, MR = 20;
  const iW = w - ML - MR, iH = H - MT - MB;

  const shortageNum: Record<ShortageStatus, number> = { Shortage: 3, Regional: 2, Balanced: 1, Surplus: 0, NA: 0 };
  const data = JSA_ICT_OCCUPATIONS.map(o => ({ ...o, sx: shortageNum[o.status2024] }));

  const [hovered, setHovered] = useState<typeof data[0] | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);

    const xScale = d3.scaleLinear().domain([-0.5, 3.5]).range([0, iW]);
    const yScale = d3.scaleLinear().domain([50000, 320000]).range([iH, 0]);
    const rScale = d3.scaleSqrt().domain([0, 100]).range([4, 14]);

    // grid
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `$${(+d / 1000).toFixed(0)}k`).tickSize(-iW))
      .call(gx => { gx.select('.domain').remove(); gx.selectAll('line').attr('stroke', '#f3f4f6'); gx.selectAll('text').style('font-size', '0.62rem').attr('fill', '#9ca3af'); });

    // quadrant labels
    const quadrants = [
      { x: iW * 0.75, y: 16, text: '🎯 Target', color: '#dc2626' },
      { x: iW * 0.1,  y: iH - 6, text: 'Avoid', color: '#9ca3af' },
    ];
    quadrants.forEach(q => g.append('text').attr('x', q.x).attr('y', q.y).style('font-size', '0.65rem').attr('fill', q.color).attr('font-weight', 600).text(q.text));

    // x-axis labels
    const xLabels = ['Surplus', 'Balanced', 'Regional', 'Shortage'];
    xLabels.forEach((lbl, i) => {
      g.append('text').attr('x', xScale(i)).attr('y', iH + 18)
        .attr('text-anchor', 'middle').style('font-size', '0.62rem').attr('fill', '#6b7280').text(lbl);
    });
    g.append('text').attr('x', iW / 2).attr('y', iH + 36)
      .attr('text-anchor', 'middle').style('font-size', '0.65rem').attr('fill', '#9ca3af').text('2024 Shortage Status →');

    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -40)
      .attr('text-anchor', 'middle').style('font-size', '0.65rem').attr('fill', '#9ca3af').text('Median Salary');

    const bubbles = g.selectAll('.bubble').data(data).join('circle')
      .attr('cx', d => xScale(d.sx))
      .attr('cy', d => yScale(d.salary))
      .attr('r', d => rScale(d.demand))
      .attr('fill', d => STATUS_COLOR[d.status2024].text)
      .attr('opacity', 0.75)
      .attr('stroke', 'white').attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d) => setHovered(d))
      .on('mouseleave', () => setHovered(null));

  }, [w]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ width: '100%' }}>
        <svg width={w} height={H} />
      </div>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          background: 'white', border: '1px solid var(--parchment)', borderRadius: '8px',
          padding: '0.5rem 0.75rem', fontSize: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, maxWidth: 180,
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: 'var(--brown-dark)' }}>{hovered.role}</div>
          <div style={{ color: STATUS_COLOR[hovered.status2024].text }}>{STATUS_COLOR[hovered.status2024].label}</div>
          <div style={{ color: '#374151' }}>Salary: ${(hovered.salary / 1000).toFixed(0)}k</div>
          <div style={{ color: '#6b7280', fontSize: '0.68rem' }}>Demand index: {hovered.demand}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main export
   ══════════════════════════════════════════════════════════════════════ */
export default function JobMarketCharts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── 0. ACS Digital Pulse ─────────────────────────── */}
      <DigitalPulseCard />

      {/* ── 1. ABS IVI ───────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.3rem', marginTop: 0 }}>
          ICT Vacancy Index vs All Occupations
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', marginTop: 0 }}>
          ICT demand surged 90% above pre-COVID baseline by mid-2022, then fell sharply as the tech correction hit.
          Early 2025 shows a tentative uptick — driven by AI-related hiring.
        </p>
        <Label>Quarterly Vacancy Index (Base: Q1 2020 = 100)</Label>
        <IVILineChart />
        <div style={{ marginTop: '1.5rem' }}>
          <Label>ICT Vacancy Index by State — Latest Quarter (est.)</Label>
          <IVIStateChart />
        </div>
        <Citation>
          Source:{' '}
          <a href="https://www.jobsandskills.gov.au/data/internet-vacancy-index" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            Jobs & Skills Australia — Internet Vacancy Index
          </a>
          {' '}(formerly ABS IVI). Quarterly snapshots re-indexed to Q1 2020 = 100.
          Figures for 2024–2025 consistent with JSA-reported −18.2% YoY decline; marked as estimated.
        </Citation>
      </section>

      {/* ── 2. ACS Salary ────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.3rem', marginTop: 0 }}>
          Salary Benchmarks by Role
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', marginTop: 0 }}>
          ML/AI and DevOps/Cloud command the highest growth (+18% and +11% YoY). Senior roles
          in architecture and cloud regularly exceed $170k–$195k. Government IT and outsourcing
          pay significantly below market.
        </p>
        <Label>Salary Range by Role — AUD (Junior / Mid / Senior)</Label>
        <SalaryChart />
        <Citation>
          Source:{' '}
          <a href="https://ia.acs.org.au/article/2025/tech-salaries-grew-10--last-year.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            ACS / Think & Grow Australian Tech Salary Guide 2025
          </a>
          {' '}— verified against published ACS Information Age salary report (April 2025).
          All figures in AUD. YoY growth rates from same report.
        </Citation>
      </section>

      {/* ── 3. QILT ──────────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
          color: 'var(--brown-dark)', marginBottom: '0.3rem', marginTop: 0 }}>
          Graduate Employment Outcomes
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', marginTop: 0 }}>
          IT grad employment recovered strongly post-COVID, peaking at 79% in 2023, but eased slightly in 2024
          as tech hiring slowed. Median starting salary grew from $62k (2018) to $73k (2024).
        </p>
        <Label>IT Graduate Full-Time Employment Rate (4 months post-graduation)</Label>
        <GradEmploymentChart />
        <div style={{ marginTop: '1.5rem' }}>
          <Label>Full-Time Employment Rate by Field of Study (2024)</Label>
          <GradFieldChart />
        </div>
        <Citation>
          Source:{' '}
          <a href="https://www.qilt.edu.au/surveys/graduate-outcomes-survey-(gos)" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            QILT Graduate Outcomes Survey 2024 — National Report
          </a>
          {' '}(qilt.edu.au). Field: Computing & Information Systems.
          Employment rate = full-time employed 4 months after graduation.
        </Citation>
      </section>

      {/* ── 4. JSA Skills ────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem' }}>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1rem', fontWeight: 700,
            color: 'var(--brown-dark)', margin: 0 }}>
            ICT Skills Shortage Matrix
          </h3>
          <span style={{
            fontSize: '0.63rem', fontWeight: 600, padding: '0.15rem 0.55rem',
            borderRadius: '99px', background: '#f0fdf4', color: '#16a34a',
            border: '1px solid #bbf7d0',
          }}>
            Last updated: Oct 2024
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', marginTop: 0 }}>
          Software Developers, Cyber Security Engineers, DevOps and ML/AI Engineers remain in
          national shortage. 2024 saw many roles exit shortage as the post-COVID hiring wave normalised —
          but AI-adjacent roles are still tight.
        </p>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {(Object.entries(STATUS_COLOR) as [ShortageStatus, typeof STATUS_COLOR[ShortageStatus]][])
            .filter(([k]) => k !== 'NA')
            .map(([status, c]) => (
              <span key={status} style={{
                fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '99px',
                background: c.bg, color: c.text, border: `1px solid ${c.text}30`, fontWeight: 600,
              }}>
                {c.label}
              </span>
            ))}
        </div>

        <Label>ICT Occupation Shortage Status 2022–2024 (JSA OSL)</Label>
        <JSAMatrix />

        <div style={{ marginTop: '1.5rem' }}>
          <Label>Shortage vs Salary — Bubble Chart (2024, bubble = demand index)</Label>
          <JSABubble />
        </div>

        <Citation>
          Source:{' '}
          <a href="https://www.jobsandskills.gov.au/data/skills-priority-list" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            Jobs & Skills Australia — Occupation Shortage List 2024
          </a>
          {' '}(October 2024). ANZSCO Sub-Major Group 26 — ICT Professionals.
          Salary figures from JSA/ACS combined data. Demand index = relative online job ad volume (0–100).
        </Citation>
      </section>

    </div>
  );
}
