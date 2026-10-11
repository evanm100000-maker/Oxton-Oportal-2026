/**
 * Converts a UTC date string and UTC time string into the user's local time string.
 * @param {string} dateStr - e.g., "2026-06-28"
 * @param {string} timeStr - e.g., "18:00"
 * @returns {string} Formatted local time e.g., "18:00 (Local Time)"
 */
export function formatFlightTimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  
  // Parse the input as UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Date.UTC takes month 0-11
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  
  // Format to local time string, e.g., HH:MM
  const localTimeString = utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `${localTimeString} (Local)`;
}

/**
 * Gets the local date string for the given UTC date/time.
 */
export function formatFlightDateLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  return utcDate.toLocaleDateString();
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
