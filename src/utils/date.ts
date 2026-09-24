/**
 * Court Dairy Date Utilities
 * Supports customizable date formatting standards (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD.MM.YYYY, DD MMM YYYY, MM/DD/YYYY)
 * while maintaining YYYY-MM-DD SQLite standard internally.
 */

export type DateFormatPattern =
  | 'DD-MM-YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD.MM.YYYY'
  | 'DD MMM YYYY'
  | 'MM/DD/YYYY';

export interface DateFormatOption {
  id: DateFormatPattern;
  label: string;
  example: string;
  separator: string;
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { id: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Hyphenated)', example: '24-09-2026', separator: '-' },
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Slash)', example: '24/09/2026', separator: '/' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Standard)', example: '2026-09-24', separator: '-' },
  { id: 'DD.MM.YYYY', label: 'DD.MM.YYYY (Dot Separated)', example: '24.09.2026', separator: '.' },
  { id: 'DD MMM YYYY', label: 'DD MMM YYYY (Judicial Text)', example: '24 Sep 2026', separator: ' ' },
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Standard)', example: '09/24/2026', separator: '/' },
];

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

export function getStoredDateFormat(): DateFormatPattern {
  try {
    const saved = localStorage.getItem('court_dairy_date_format') as DateFormatPattern;
    if (saved && DATE_FORMAT_OPTIONS.some(o => o.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'DD-MM-YYYY';
}

export function setStoredDateFormat(format: DateFormatPattern): void {
  try {
    localStorage.setItem('court_dairy_date_format', format);
  } catch {
    // ignore
  }
}

/**
 * Parse any date string into standard ISO YYYY-MM-DD
 */
export function toIsoDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // 1. Textual month format: "24 Sep 2026" or "24 September 2026"
  const textMonthMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, '0');
    const monStr = textMonthMatch[2].toLowerCase();
    const mon = MONTH_MAP[monStr];
    const year = textMonthMatch[3];
    if (mon) return `${year}-${mon}-${day}`;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 4. ISO Date time string (2026-09-24T12:00:00Z)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }

  // 5. Native date parser fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

/**
 * Format an ISO date or date string according to a selected format pattern
 */
export function formatDateByPattern(isoOrDateStr?: string | null, pattern: DateFormatPattern = 'DD-MM-YYYY'): string {
  if (!isoOrDateStr) return '';
  const iso = toIsoDate(isoOrDateStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return isoOrDateStr;

  const [y, m, d] = iso.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const monthShort = MONTH_NAMES_SHORT[monthIdx] || m;

  switch (pattern) {
    case 'DD-MM-YYYY':
      return `${d}-${m}-${y}`;
    case 'DD/MM/YYYY':
      return `${d}/${m}/${y}`;
    case 'YYYY-MM-DD':
      return `${y}-${m}-${d}`;
    case 'DD.MM.YYYY':
      return `${d}.${m}.${y}`;
    case 'DD MMM YYYY':
      return `${d} ${monthShort} ${y}`;
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`;
    default:
      return `${d}-${m}-${y}`;
  }
}

/**
 * Legacy compatibility toDisplayDate
 */
export function toDisplayDate(isoOrDateStr?: string | null): string {
  const pattern = getStoredDateFormat();
  return formatDateByPattern(isoOrDateStr, pattern);
}

export function getTodayDisplay(pattern: DateFormatPattern = 'DD-MM-YYYY'): string {
  return formatDateByPattern(getTodayIso(), pattern);
}

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
