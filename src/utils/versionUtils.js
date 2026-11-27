export const CURRENT_APP_VERSION = '2.1.59';

/**
 * Normalizes a version string by stripping leading 'v' or 'V' and whitespace.
 */
export function normalizeVersion(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^v/i, '').trim();
}

/**
 * Compares two semantic version strings (e.g., "2.1.5" and "2.1.51").
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 === v2
 *    1 if v1 > v2
 */
export function compareVersions(v1, v2) {
  const clean1 = normalizeVersion(v1);
  const clean2 = normalizeVersion(v2);

  if (!clean1 && !clean2) return 0;
  if (!clean1) return -1;
  if (!clean2) return 1;
  if (clean1 === clean2) return 0;

  const parts1 = clean1.split(/[^0-9a-zA-Z]+/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? p : num;
  });
  const parts2 = clean2.split(/[^0-9a-zA-Z]+/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? p : num;
  });

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] !== undefined ? parts1[i] : 0;
    const p2 = parts2[i] !== undefined ? parts2[i] : 0;

    if (p1 === p2) continue;

    if (typeof p1 === 'number' && typeof p2 === 'number') {
      return p1 < p2 ? -1 : 1;
    }
    return String(p1).localeCompare(String(p2));
  }

  return 0;
}

/**
 * Checks if clientVersion is outdated compared to the required site version.
 * Returns true if requiredVersion is present and clientVersion is strictly older.
 */
export function isVersionOutdated(clientVersion = CURRENT_APP_VERSION, requiredVersion) {
  if (!requiredVersion) return false;
  const cleanClient = normalizeVersion(clientVersion);
  const cleanReq = normalizeVersion(requiredVersion);
  if (!cleanReq) return false;
  if (cleanClient === cleanReq) return false;
  return compareVersions(cleanClient, cleanReq) < 0;
}
