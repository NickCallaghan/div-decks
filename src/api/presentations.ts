import type { PresentationFile } from '../types/presentation';

export async function fetchPresentationList(): Promise<PresentationFile[]> {
  const res = await fetch('/api/presentations');
  if (!res.ok) throw new Error('Failed to fetch presentations');
  const data = await res.json();
  return data.files;
}

export async function fetchPresentation(filename: string): Promise<string> {
  const res = await fetch(`/api/presentations/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}`);
  return res.text();
}

export async function savePresentation(filename: string, html: string): Promise<void> {
  const res = await fetch(`/api/presentations/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/html' },
    body: html,
  });
  if (!res.ok) throw new Error('Failed to save presentation');
}

export async function backupPresentation(filename: string): Promise<string> {
  const res = await fetch(`/api/presentations/${encodeURIComponent(filename)}/backup`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create backup');
  const data = await res.json();
  return data.backupPath;
}
