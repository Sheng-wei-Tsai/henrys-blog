'use client';
import dynamic from 'next/dynamic';

const BoulderingGame = dynamic(() => import('./BoulderingGame'), { ssr: false });

export default function BoulderingSection() {
  return <BoulderingGame />;
}
