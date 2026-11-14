/**
 * Helper to get the short timezone abbreviation for a given date and timezone (e.g., "GMT", "BST", "EST", "EDT", "PST").
 */
export function getTimezoneAbbr(date = new Date(), timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}

/**
 * Parses a date string (YYYY-MM-DD) and time string (HH:mm) in a specific timezone
 * and returns the exact UTC Date object.
 */
export function parseDateTimeInTimezone(dateStr, timeStr, timeZone = 'Europe/London') {
  if (!dateStr || !timeStr) return null;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hr, min] = timeStr.split(':').map(Number);
    if (!y || !m || !d || hr === undefined || min === undefined) return null;

    // Initial UTC guess
    const guessUtc = new Date(Date.UTC(y, m - 1, d, hr, min));
    
    // Check how guessUtc renders in the target timeZone to compute the offset difference
    const invDate = new Date(guessUtc.toLocaleString('en-US', { timeZone }));
    const diff = guessUtc.getTime() - invDate.getTime();
    
    return new Date(guessUtc.getTime() + diff);
  } catch {
    return new Date(`${dateStr}T${timeStr}`);
  }
}

/**
 * Resolves the exact UTC Date object for a flight.
 * Checks for scheduledUtc first, then parses date + time using uploaderTimezone (or Europe/London fallback for legacy flights).
 */
export function getFlightUtcDate(flight) {
  if (!flight) return null;
  if (flight.scheduledUtc) {
    const d = new Date(flight.scheduledUtc);
    if (!isNaN(d.getTime())) return d;
  }
  if (!flight.date || !flight.time) return null;
  
  const tz = flight.uploaderTimezone || 'Europe/London';
  const parsed = parseDateTimeInTimezone(flight.date, flight.time, tz);
  if (parsed && !isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(`${flight.date}T${flight.time}`);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats a flight's date and time dynamically for the viewer's current timezone.
 * For example, if uploaded in GMT at 18:30, a user in EST will automatically see 13:30 EST.
 */
export function formatFlightForViewer(flight) {
  const utcDate = getFlightUtcDate(flight);
  if (!utcDate || isNaN(utcDate.getTime())) {
    return {
      date: flight?.date || '',
      dateIso: flight?.date || '',
      time: flight?.time || '',
      timezone: 'Local',
      uploaderNote: '',
      formattedFull: `${flight?.date || ''} ${flight?.time || ''}`,
      utcDate: null
    };
  }

  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const viewerTzAbbr = getTimezoneAbbr(utcDate, viewerTz);

  // Viewer's local 24h time e.g., "18:30"
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');
  const localTime = `${hours}:${minutes}`;

  // Viewer's local date
  const localDate = utcDate.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // ISO date string in viewer's timezone for accurate day-filtering
  const y = utcDate.getFullYear();
  const m = String(utcDate.getMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getDate()).padStart(2, '0');
  const localDateIso = `${y}-${m}-${d}`;

  // If the flight was uploaded in a different timezone, note the uploader's time for transparency
  let uploaderNote = '';
  if (flight.uploaderTzAbbr && viewerTzAbbr && flight.uploaderTzAbbr !== viewerTzAbbr) {
    uploaderNote = `${flight.time} ${flight.uploaderTzAbbr}`;
  }

  return {
    date: localDate,
    dateIso: localDateIso,
    time: localTime,
    timezone: viewerTzAbbr || 'Local',
    uploaderNote,
    formattedFull: `${localDate} at ${localTime} ${viewerTzAbbr || ''}`.trim(),
    utcDate
  };
}

/**
 * Converts a UTC date string and UTC time string into the user's local time string.
 * @param {string} dateStr - e.g., "2026-06-28"
 * @param {string} timeStr - e.g., "18:00"
 * @returns {string} Formatted local time e.g., "18:00 (Local Time)"
 */
export function formatFlightTimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const parsed = parseDateTimeInTimezone(dateStr, timeStr, 'Europe/London');
  if (!parsed || isNaN(parsed.getTime())) return timeStr;
  const tzAbbr = getTimezoneAbbr(parsed);
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${tzAbbr}`.trim();
}

/**
 * Gets the local date string for the given date/time.
 */
export function formatFlightDateLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const parsed = parseDateTimeInTimezone(dateStr, timeStr, 'Europe/London');
  if (!parsed || isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Determines whether an LOA record is currently active (today falls between startDate and endDate).
 * An LOA is only active when:
 * 1. Status is 'Approved' (or 'End Requested')
 * 2. Today is >= startDate (if startDate provided)
 * 3. Today is <= endDate (if endDate provided)
 */
export function isLoaActive(loa, referenceDate = new Date()) {
  if (!loa) return false;
  if (loa.status !== 'Approved' && loa.status !== 'End Requested') return false;

  const now = new Date(referenceDate);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (loa.startDate && loa.startDate > todayStr) return false;
  if (loa.endDate && loa.endDate < todayStr) return false;

  return true;
}

/**
 * Checks if a specific staff email currently has an active LOA.
 */
export function isUserOnActiveLoa(userEmail, loaRequests, referenceDate = new Date()) {
  if (!userEmail || !Array.isArray(loaRequests)) return false;
  const cleanEmail = userEmail.toLowerCase().trim();
  return loaRequests.some(loa => {
    if (!loa || !loa.userEmail) return false;
    if (loa.userEmail.toLowerCase().trim() !== cleanEmail) return false;
    return isLoaActive(loa, referenceDate);
  });
}

/**
 * Strips any literal [LOA] or (LOA) tags from a user's display name if not on active LOA.
 */
export function cleanStaffName(name, isOnLoa = false) {
  if (!name) return '';
  if (isOnLoa) return name;
  return name.replace(/\s*\[LOA\]/gi, '').replace(/\s*\(LOA\)/gi, '').trim();
}

/**
 * Gets the UTC Date object corresponding to the next Monday 00:00:00 Europe/London time.
 */
export function getNextMondayMidnightUK(fromDate = new Date()) {
  const d = new Date(fromDate.getTime());
  
  // Advance to next Monday
  const day = d.getDay();
  let diff = (1 - day + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  
  // Use Intl.DateTimeFormat to see if it is BST or GMT on that date
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(d);
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value;
  
  d.setUTCHours(0, 0, 0, 0);
  if (tzName === 'BST') {
    // BST is UTC+1, so midnight BST is 23:00 UTC previous day
    d.setUTCHours(23, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - 1);
  }
  
  return d;
}

/**
 * Formats a Date object as 'Weekday Dth Month YYYY'
 * @param {Date} date 
 * @returns {string} e.g., 'Sunday 5th July 2026'
 */
export function formatCustomLongDate(date) {
  if (!date) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const day = date.getDate();
  
  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';
  
  return `${dayName} ${day}${suffix} ${monthName} ${year}`;
}
