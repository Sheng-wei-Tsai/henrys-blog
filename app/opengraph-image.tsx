import { ImageResponse } from 'next/og';

export const alt = 'Henry Tsai — Full Stack Developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
          background: '#f5f0e8',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #c0281c 0%, #c88a14 50%, #1e7a52 100%)',
          display: 'flex',
        }} />

        {/* Domain */}
        <div style={{
          fontSize: 22, fontWeight: 600,
          color: '#c0281c', letterSpacing: '0.05em',
          marginBottom: 48, fontFamily: 'Georgia, serif',
          display: 'flex',
        }}>
          henrysdigitallife.com
        </div>

        {/* Name */}
        <div style={{
          fontSize: 72, fontWeight: 700,
          color: '#1a0a03', lineHeight: 1.1,
          marginBottom: 20,
          display: 'flex',
        }}>
          Henry Tsai
        </div>

        {/* Title */}
        <div style={{
          fontSize: 34, fontWeight: 400,
          color: '#3d1c0e', marginBottom: 48,
          display: 'flex',
        }}>
          Full Stack Developer · Brisbane, Australia
        </div>

        {/* Divider */}
        <div style={{
          width: 80, height: 4, borderRadius: 2,
          background: '#c0281c', marginBottom: 40,
          display: 'flex',
        }} />

        {/* Description */}
        <div style={{
          fontSize: 24, color: '#5c3d2e', lineHeight: 1.5,
          maxWidth: 800,
          display: 'flex',
        }}>
          Job search tools · AI interview prep · Cover letter generator · AU IT career insights
        </div>
      </div>
    ),
    { ...size },
  );
}
