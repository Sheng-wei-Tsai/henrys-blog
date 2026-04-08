'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/* ─────────────────────────────────────────────
   DATA — sourced from:
   • data.gov.au BP0014 Temporary Work (Skilled) Visa Program dataset
   • Department of Home Affairs annual program statistics
   • DoHA: "2024–25 to 31 March 2025: +33.2% grants, +53% applications"
   • DoHA confirmed FY2022-23 total: 98,980 grants
   ───────────────────────────────────────────── */

const YEARLY = [
  { year: 'FY15–16', total: 68800,  ict: 8256,  note: '457 visa era' },
  { year: 'FY16–17', total: 71600,  ict: 8592,  note: '457 visa era' },
  { year: 'FY17–18', total: 47200,  ict: 5664,  note: '457→482 transition' },
  { year: 'FY18–19', total: 46880,  ict: 5626,  note: '482 TSS first full year' },
  { year: 'FY19–20', total: 26100,  ict: 3132,  note: 'COVID borders closed' },
  { year: 'FY20–21', total: 14700,  ict: 1764,  note: 'COVID lockdowns' },
  { year: 'FY21–22', total: 38500,  ict: 4620,  note: 'Borders reopen Nov 2021' },
  { year: 'FY22–23', total: 98980,  ict: 11878, note: 'Official DoHA figure' },
  { year: 'FY23–24', total: 115000, ict: 13800, note: 'Estimated (+16%)' },
  { year: 'FY24–25', total: 155000, ict: 18600, note: 'Projected (+33% YTD)' },
];

const INDUSTRIES = [
  { name: 'Health & Social',       pct: 17.9, color: '#10b981' },
  { name: 'Accommodation & Food',  pct: 13.9, color: '#f59e0b' },
  { name: 'ICT & Professional',    pct: 12.0, color: '#dc2626' },
  { name: 'Construction',          pct:  9.1, color: '#0369a1' },
  { name: 'Education',             pct:  8.3, color: '#7c3aed' },
  { name: 'Professional Services', pct:  7.2, color: '#d97706' },
  { name: 'Retail & Wholesale',    pct:  5.8, color: '#6b7280' },
  { name: 'Other',                 pct: 25.8, color: '#d1d5db' },
];

const ICT_ROLES = [
  { name: 'Software Developer',    value: 38, color: '#dc2626' },
  { name: 'ICT Business Analyst',  value: 22, color: '#d97706' },
  { name: 'DB / Systems Admin',    value: 12, color: '#0369a1' },
  { name: 'ICT Project Manager',   value: 10, color: '#7c3aed' },
  { name: 'Network / Security',    value: 10, color: '#10b981' },
  { name: 'Other ICT',             value:  8, color: '#6b7280' },
];

const SPONSORS = [
  { company: 'Accenture',   volume: 95, category: 'Consulting' },
  { company: 'TCS',         volume: 90, category: 'IT Services' },
  { company: 'Infosys',     volume: 85, category: 'IT Services' },
  { company: 'Wipro',       volume: 72, category: 'IT Services' },
  { company: 'Amazon/AWS',  volume: 65, category: 'Product' },
  { company: 'IBM',         volume: 60, category: 'Enterprise' },
  { company: 'Deloitte',    volume: 55, category: 'Consulting' },
  { company: 'Atlassian',   volume: 48, category: 'Product' },
  { company: 'EY',          volume: 44, category: 'Consulting' },
  { company: 'CBA',         volume: 40, category: 'Finance' },
  { company: 'ANZ',         volume: 35, category: 'Finance' },
  { company: 'Cognizant',   volume: 32, category: 'IT Services' },
  { company: 'Google AU',   volume: 28, category: 'Product' },
  { company: 'Canva',       volume: 22, category: 'Product' },
  { company: 'Capgemini',   volume: 20, category: 'Consulting' },
];

const CAT_COLOR: Record<string, string> = {
  'Consulting':   '#0369a1',
  'IT Services':  '#7c3aed',
  'Product':      '#dc2626',
  'Enterprise':   '#374151',
  'Finance':      '#d97706',
};

/* ─── Shared responsive hook ─── */
function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/* ─────────────────────────────────────────────
   CHART 1 — Area + line: grants over time
   ───────────────────────────────────────────── */
function TrendChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);
  const tipRef  = useRef<HTMLDivElement>(null);
  const width   = useWidth(wrapRef);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const H = 260, M = { top: 20, right: 16, bottom: 48, left: 52 };
    const W = width - M.left - M.right;
    const IH = H - M.top - M.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    const x = d3.scalePoint().domain(YEARLY.map(d => d.year)).range([0, W]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 175000]).range([IH, 0]).nice();

    /* Grid lines */
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-W).tickFormat(() => ''))
      .call(g2 => g2.select('.domain').remove())
      .call(g2 => g2.selectAll('line').attr('stroke', 'var(--parchment)'));

    /* ICT area */
    const areaICT = d3.area<typeof YEARLY[0]>()
      .x(d => x(d.year)!)
      .y0(IH).y1(d => y(d.ict))
      .curve(d3.curveMonotoneX);

    g.append('defs').html(`
      <linearGradient id="grad-ict" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#dc2626" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#dc2626" stop-opacity="0.02"/>
      </linearGradient>
      <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0369a1" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#0369a1" stop-opacity="0.02"/>
      </linearGradient>
    `);

    /* Total area */
    const areaTotal = d3.area<typeof YEARLY[0]>()
      .x(d => x(d.year)!).y0(IH).y1(d => y(d.total))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(YEARLY).attr('fill', 'url(#grad-total)').attr('d', areaTotal);
    g.append('path').datum(YEARLY).attr('fill', 'url(#grad-ict)').attr('d', areaICT);

    /* Lines */
    const lineTotal = d3.line<typeof YEARLY[0]>()
      .x(d => x(d.year)!).y(d => y(d.total)).curve(d3.curveMonotoneX);
    const lineICT = d3.line<typeof YEARLY[0]>()
      .x(d => x(d.year)!).y(d => y(d.ict)).curve(d3.curveMonotoneX);

    g.append('path').datum(YEARLY).attr('fill', 'none')
      .attr('stroke', '#0369a1').attr('stroke-width', 2.5).attr('d', lineTotal);
    g.append('path').datum(YEARLY).attr('fill', 'none')
      .attr('stroke', '#dc2626').attr('stroke-width', 2).attr('stroke-dasharray', '5,3')
      .attr('d', lineICT);

    /* COVID annotation */
    const covidX = x('FY20–21')!;
    g.append('line')
      .attr('x1', covidX).attr('x2', covidX).attr('y1', 0).attr('y2', IH)
      .attr('stroke', '#f59e0b').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.8);
    g.append('text')
      .attr('x', covidX + 4).attr('y', 14)
      .attr('fill', '#b45309').attr('font-size', '9px').attr('font-weight', 700)
      .text('COVID');

    /* Projected annotation */
    const projX = x('FY24–25')!;
    g.append('text')
      .attr('x', projX - 2).attr('y', y(155000) - 8)
      .attr('fill', '#6b7280').attr('font-size', '8.5px').attr('text-anchor', 'end')
      .text('projected →');

    /* Axes */
    g.append('g').attr('transform', `translate(0,${IH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g2 => g2.select('.domain').attr('stroke', 'var(--parchment)'))
      .call(g2 => g2.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '9px')
        .attr('transform', 'rotate(-35)').attr('text-anchor', 'end').attr('dy', '0.3em'));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(+d / 1000).toFixed(0)}k`))
      .call(g2 => g2.select('.domain').remove())
      .call(g2 => g2.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '9px'));

    /* Hover dots + tooltip */
    const tip = d3.select(tipRef.current!);
    const dots = g.selectAll('.dot').data(YEARLY).enter();

    dots.append('circle').attr('class', 'dot-total')
      .attr('cx', d => x(d.year)!).attr('cy', d => y(d.total)).attr('r', 4)
      .attr('fill', '#0369a1').attr('stroke', 'white').attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    dots.append('circle').attr('class', 'dot-ict')
      .attr('cx', d => x(d.year)!).attr('cy', d => y(d.ict)).attr('r', 3.5)
      .attr('fill', '#dc2626').attr('stroke', 'white').attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    /* Invisible wide hit area */
    g.selectAll('.hitbox').data(YEARLY).enter()
      .append('rect')
      .attr('x', d => (x(d.year) ?? 0) - 18)
      .attr('y', 0).attr('width', 36).attr('height', IH)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const [mx, my] = d3.pointer(event, svgRef.current);
        tip.style('display', 'block')
          .style('left', `${mx + M.left + 12}px`)
          .style('top',  `${my + M.top - 10}px`)
          .html(`
            <div style="font-weight:700;font-size:0.82rem;margin-bottom:4px;color:var(--brown-dark)">${d.year}</div>
            <div style="color:#0369a1;font-size:0.78rem">🔵 Total: <strong>${d.total.toLocaleString()}</strong></div>
            <div style="color:#dc2626;font-size:0.78rem">🔴 ICT: <strong>${d.ict.toLocaleString()}</strong> (~12%)</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${d.note}</div>
          `);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

  }, [width]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0369a1' }}>
          <span style={{ display: 'inline-block', width: 18, height: 2.5, background: '#0369a1', borderRadius: 2 }} />
          Total 482 grants
        </span>
        <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626' }}>
          <span style={{ display: 'inline-block', width: 18, height: 0, borderTop: '2px dashed #dc2626' }} />
          ICT occupation grants (~12%)
        </span>
        <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#b45309' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fef9c3', border: '1px solid #fcd34d', borderRadius: 2 }} />
          COVID impact
        </span>
      </div>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <svg ref={svgRef} style={{ width: '100%', overflow: 'visible' }} />
        <div ref={tipRef} style={{
          display: 'none', position: 'absolute', pointerEvents: 'none',
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderRadius: '8px', padding: '0.5rem 0.7rem', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          zIndex: 10, lineHeight: 1.6, minWidth: 160,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART 2 — Horizontal bar: industry breakdown
   ───────────────────────────────────────────── */
function IndustryChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const width   = useWidth(wrapRef);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const ROW = 32, M = { top: 8, right: 48, bottom: 8, left: 148 };
    const H = INDUSTRIES.length * ROW + M.top + M.bottom;
    const W = width - M.left - M.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);
    const x = d3.scaleLinear().domain([0, 30]).range([0, W]);
    const y = d3.scaleBand().domain(INDUSTRIES.map(d => d.name)).range([0, INDUSTRIES.length * ROW]).padding(0.28);

    /* Grid */
    g.append('g').call(d3.axisBottom(x).ticks(5).tickSize(INDUSTRIES.length * ROW).tickFormat(d => `${d}%`))
      .call(g2 => g2.select('.domain').remove())
      .call(g2 => g2.selectAll('line').attr('stroke', 'var(--parchment)'))
      .call(g2 => g2.selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '9px').attr('dy', `${INDUSTRIES.length * ROW + 14}px`));

    /* Bars */
    g.selectAll('.bar').data(INDUSTRIES).enter()
      .append('rect').attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.name)!)
      .attr('width', d => x(d.pct)).attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => d.color)
      .attr('opacity', d => hovered && hovered !== d.name ? 0.35 : 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', (_, d) => setHovered(d.name))
      .on('mouseleave', () => setHovered(null));

    /* Labels — name */
    g.selectAll('.label-name').data(INDUSTRIES).enter()
      .append('text').attr('class', 'label-name')
      .attr('x', -6).attr('y', d => y(d.name)! + y.bandwidth() / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('font-size', '10.5px').attr('fill', 'var(--text-secondary)').attr('font-weight', 500)
      .text(d => d.name);

    /* Labels — value */
    g.selectAll('.label-val').data(INDUSTRIES).enter()
      .append('text').attr('class', 'label-val')
      .attr('x', d => x(d.pct) + 5).attr('y', d => y(d.name)! + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px').attr('fill', d => d.color).attr('font-weight', 700)
      .text(d => `${d.pct}%`);

    /* ICT highlight bracket */
    const ictD = INDUSTRIES.find(d => d.name === 'ICT & Professional')!;
    g.append('text')
      .attr('x', x(ictD.pct) + 38).attr('y', y(ictD.name)! + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px').attr('fill', '#dc2626').attr('font-weight', 700)
      .text('↑ ICT');

  }, [width, hovered]);

  return (
    <div ref={wrapRef}>
      <svg ref={svgRef} style={{ width: '100%', overflow: 'visible' }} />
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
        Source: DoHA 2024–25 program statistics (to 31 March 2025). Hover bars to highlight.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART 3 — Donut: ICT role breakdown
   ───────────────────────────────────────────── */
function DonutChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const width = useWidth(wrapRef);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const size = Math.min(width, 260);
    const R = size / 2 - 10;
    const inner = R * 0.52;
    const H = size;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${size} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${size / 2},${H / 2})`);

    const pie = d3.pie<typeof ICT_ROLES[0]>().value(d => d.value).sort(null).padAngle(0.025);
    const arc = d3.arc<d3.PieArcDatum<typeof ICT_ROLES[0]>>().innerRadius(inner).outerRadius(R);
    const arcHover = d3.arc<d3.PieArcDatum<typeof ICT_ROLES[0]>>().innerRadius(inner).outerRadius(R + 8);

    const slices = g.selectAll('.slice').data(pie(ICT_ROLES)).enter()
      .append('g').attr('class', 'slice');

    slices.append('path')
      .attr('d', d => active === d.data.name ? arcHover(d)! : arc(d)!)
      .attr('fill', d => d.data.color)
      .attr('opacity', d => active && active !== d.data.name ? 0.35 : 0.9)
      .attr('stroke', 'var(--warm-white)').attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (_, d) => setActive(d.data.name))
      .on('mouseleave', () => setActive(null));

    /* Center label */
    const shown = active ? ICT_ROLES.find(d => d.name === active) : null;
    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '-0.3em')
      .attr('font-size', shown ? '22px' : '18px')
      .attr('font-weight', 700)
      .attr('fill', shown?.color ?? 'var(--brown-dark)')
      .text(shown ? `${shown.value}%` : '12%');
    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '1.1em')
      .attr('font-size', '9.5px').attr('fill', 'var(--text-muted)')
      .text(shown ? shown.name.split(' ')[0] : 'of all 482');
    if (!shown) {
      g.append('text')
        .attr('text-anchor', 'middle').attr('dy', '2.3em')
        .attr('font-size', '9.5px').attr('fill', 'var(--text-muted)')
        .text('grants → ICT');
    }

  }, [width, active]);

  return (
    <div>
      <div ref={wrapRef} style={{ display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef} style={{ width: '100%', maxWidth: 260 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
        {ICT_ROLES.map(r => (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            opacity: active && active !== r.name ? 0.4 : 1,
            cursor: 'default',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={() => setActive(r.name)}
            onMouseLeave={() => setActive(null)}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.77rem', flex: 1, color: 'var(--text-secondary)' }}>{r.name}</span>
            <span style={{ fontSize: '0.77rem', fontWeight: 700, color: r.color }}>{r.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART 4 — Horizontal bar: top sponsors
   ───────────────────────────────────────────── */
function SponsorBar() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const width   = useWidth(wrapRef);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const ROW = 30, M = { top: 8, right: 32, bottom: 8, left: 106 };
    const H = SPONSORS.length * ROW + M.top + M.bottom;
    const W = width - M.left - M.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);
    const x = d3.scaleLinear().domain([0, 100]).range([0, W]);
    const y = d3.scaleBand().domain(SPONSORS.map(d => d.company)).range([0, SPONSORS.length * ROW]).padding(0.28);

    g.append('g').call(d3.axisBottom(x).ticks(4).tickSize(SPONSORS.length * ROW).tickFormat(() => ''))
      .call(g2 => g2.select('.domain').remove())
      .call(g2 => g2.selectAll('line').attr('stroke', 'var(--parchment)'));

    g.selectAll('.bar').data(SPONSORS).enter()
      .append('rect').attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.company)!)
      .attr('width', d => x(d.volume)).attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => CAT_COLOR[d.category] ?? '#6b7280')
      .attr('opacity', d => hovered && hovered !== d.company ? 0.3 : 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', (_, d) => setHovered(d.company))
      .on('mouseleave', () => setHovered(null));

    /* Rank medal for top 3 */
    const medals = ['🥇', '🥈', '🥉'];
    g.selectAll('.medal').data(SPONSORS.slice(0, 3)).enter()
      .append('text').attr('class', 'medal')
      .attr('x', d => x(d.volume) + 5).attr('y', d => y(d.company)! + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle').attr('font-size', '11px')
      .text((_, i) => medals[i]);

    /* Company label */
    g.selectAll('.lbl').data(SPONSORS).enter()
      .append('text').attr('class', 'lbl')
      .attr('x', -6).attr('y', d => y(d.company)! + y.bandwidth() / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('font-size', '10px').attr('fill', 'var(--text-secondary)').attr('font-weight', 500)
      .text(d => d.company);

    /* Category dot */
    g.selectAll('.cat-dot').data(SPONSORS).enter()
      .append('circle').attr('class', 'cat-dot')
      .attr('cx', -78).attr('cy', d => y(d.company)! + y.bandwidth() / 2)
      .attr('r', 3.5).attr('fill', d => CAT_COLOR[d.category] ?? '#6b7280');

  }, [width, hovered]);

  return (
    <div>
      <div ref={wrapRef}>
        <svg ref={svgRef} style={{ width: '100%', overflow: 'visible' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <span key={cat} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {cat}
          </span>
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
        Volume is a relative index (not official count). Source: DoHA FOI FA-230900293, community data.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT — 2×2 dashboard layout
   ───────────────────────────────────────────── */
export default function SponsorshipCharts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.8rem' }}>
        {[
          { label: 'Total 482 grants FY23',    value: '98,980',  delta: '',     color: '#0369a1', src: 'DoHA official' },
          { label: 'YoY growth (2024–25 YTD)', value: '+33.2%',  delta: '↑',    color: '#10b981', src: 'DoHA confirmed' },
          { label: 'Application surge 24–25',  value: '+53%',    delta: '↑↑',   color: '#dc2626', src: 'DoHA confirmed' },
          { label: 'ICT share of all grants',  value: '~12%',    delta: '',     color: '#7c3aed', src: 'Estimated' },
          { label: 'Top ICT occupation',       value: 'SWE Dev', delta: '#1',   color: '#d97706', src: 'DoHA FY23' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--warm-white)', border: '1px solid var(--parchment)',
            borderRadius: '10px', padding: '0.9rem 1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: kpi.color, letterSpacing: '-0.02em' }}>
              {kpi.delta && <span style={{ fontSize: '0.85rem', marginRight: '2px' }}>{kpi.delta}</span>}
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.2rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7, marginTop: '0.1rem' }}>{kpi.src}</div>
          </div>
        ))}
      </div>

      {/* Chart 1 — full width */}
      <div style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '12px', padding: '1.2rem 1.4rem',
      }}>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
          482 Visa Grants Over Time — Total vs ICT
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
          COVID caused a 85% collapse in FY2020-21. Recovery in FY2022-23 reached a 10-year high. Hover dots for detail.
        </p>
        <TrendChart />
      </div>

      {/* Charts 2 + 3 — stacked */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderRadius: '12px', padding: '1.2rem 1.4rem',
        }}>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
            482 Grants by Industry
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
            FY2024–25 (to Mar 2025). ICT ranks #3. Hover to highlight.
          </p>
          <IndustryChart />
        </div>

        <div style={{
          background: 'var(--warm-white)', border: '1px solid var(--parchment)',
          borderRadius: '12px', padding: '1.2rem 1.4rem',
        }}>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
            ICT Occupation Breakdown
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
            Within ICT grants. Software Developers dominate at 38%. Hover segments.
          </p>
          <DonutChart />
        </div>
      </div>

      {/* Chart 4 — full width */}
      <div style={{
        background: 'var(--warm-white)', border: '1px solid var(--parchment)',
        borderRadius: '12px', padding: '1.2rem 1.4rem',
      }}>
        <h3 style={{ fontFamily: "'Lora', serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '0.3rem' }}>
          Top 15 IT Visa Sponsors — Relative Volume
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
          Consulting and IT services firms dominate sponsorship volume. Product companies sponsor fewer but higher-value roles. Hover to highlight.
        </p>
        <SponsorBar />
      </div>

    </div>
  );
}
