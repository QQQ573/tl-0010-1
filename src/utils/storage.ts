import { createSignal, createEffect } from 'solid-js';

export function createLocalStorageSignal<T>(key: string, initialValue: T) {
  const stored = localStorage.getItem(key);
  const value = stored ? (JSON.parse(stored) as T) : initialValue;
  
  const [signal, setSignal] = createSignal<T>(value);
  
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(signal()));
  });
  
  return [signal, setSignal] as const;
}

export function getCurrentUserId(): string {
  const stored = localStorage.getItem('currentUserId');
  return stored || 'm1';
}

export function setCurrentUserId(userId: string): void {
  localStorage.setItem('currentUserId', userId);
}
