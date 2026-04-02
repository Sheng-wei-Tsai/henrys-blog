import type { BoulderingSave } from './types';

const KEY = 'henry_bouldering_v1';

export function defaultSave(): BoulderingSave {
  return {
    currentGrade: 0,
    sendsPerGrade: [0, 0, 0, 0, 0],
    bestTimes: [null, null, null, null, null],
    totalAttempts: 0,
    totalSends: 0,
    dailySendDate: '',
    dailySendTime: null,
  };
}

export function loadSave(): BoulderingSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: BoulderingSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // private browsing — silently ignore
  }
}
