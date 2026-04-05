'use client';

import dynamic from 'next/dynamic';

const TomLizardScene = dynamic(() => import('./TomLizardScene'), { ssr: false });

export default function TomLizardSceneClient() {
  return <TomLizardScene />;
}
