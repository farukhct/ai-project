/**
 * Court Dairy Date Utilities
 * Enforces DD-MM-YYYY display standard everywhere while maintaining YYYY-MM-DD SQLite standard.
 */

export function toDisplayDate(isoOrDateStr?: string | null): string {
  if (!isoOrDateStr) return '';
  const trimmed = isoOrDateStr.trim();
  // If already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  // If YYYY-MM-DD or ISO timestamp
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.substring(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return trimmed;
}

export function toIsoDate(displayDateStr?: string | null): string {
  if (!displayDateStr) return '';
  const trimmed = displayDateStr.trim();
  // If DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-');
    return `${y}-${m}-${d}`;
  }
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export function getTodayDisplay(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
}

export function getRelativeBadge(dairyDateIso: string, result: string): { label: string; tone: 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'disposed' } {
  const lowerRes = (result || '').toLowerCase();
  if (['disposed', 'allowed', 'dismissed', 'withdrawn'].includes(lowerRes)) {
    return { label: 'Disposed', tone: 'disposed' };
  }

  const today = getTodayIso();
  if (dairyDateIso === today) {
    return { label: 'Today', tone: 'today' };
  }

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowIso = tomorrowDate.toISOString().split('T')[0];

  if (dairyDateIso === tomorrowIso) {
    return { label: 'Tomorrow', tone: 'tomorrow' };
  }

  if (dairyDateIso < today) {
    return { label: 'Overdue', tone: 'overdue' };
  }

  return { label: 'Upcoming', tone: 'upcoming' };
}
