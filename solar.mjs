/* NOOR solar prayer calculations — lightweight self-contained approximation.
   Solar position follows common NOAA/Meeus expressions.
   Defaults: Ja'fari/Tehran-style Fajr 17.7°, Maghrib 4.5°, Isha 14°.
   These are approximations; local religious timetables can differ.
   No network requests, no tracking. */
const R = Math.PI / 180;
const D = 180 / Math.PI;
const sin = (x) => Math.sin(x * R);
const cos = (x) => Math.cos(x * R);
const norm360 = (x) => ((x % 360) + 360) % 360;
const min = (x) => x * 60_000;
function solarTerms(jd) {
  const t = (jd - 2451545) / 36525;
  const L = norm360(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const M = norm360(357.52911 + t * (35999.05029 - 0.0001537 * t));
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = sin(M) * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin(2 * M) * (0.019993 - 0.000101 * t) + sin(3 * M) * 0.000289;
  const lambda = L + C - 0.00569 - 0.00478 * sin(125.04 - 1934.136 * t);
  const meanEps = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - 0.001813 * t))) / 60) / 60;
  const eps = meanEps + 0.00256 * cos(125.04 - 1934.136 * t);
  const decl = Math.asin(sin(eps) * sin(lambda)) * D;
  const y = Math.tan(eps * R / 2) ** 2;
  const E = 4 * D * (y * Math.sin(2 * L * R) - 2 * e * Math.sin(M * R) + 4 * e * y * Math.sin(M * R) * Math.cos(2 * L * R) - 0.5 * y * y * Math.sin(4 * L * R) - 1.25 * e * e * Math.sin(2 * M * R));
  return { decl, E };
}
function rawSolar(date, lat, lon) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
  const base = Date.UTC(y, m, d);
  const jd = base / 86_400_000 + 2440587.5;
  const initial = solarTerms(jd + 0.5);
  const noonMinute = 720 - 4 * lon - initial.E;
  const { decl, E } = solarTerms(jd + noonMinute / 1440);
  const noon = base + min(720 - 4 * lon - E);
  function atAltitude(alt, afterNoon = false) {
    const c = (sin(alt) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
    if (Math.abs(c) > 1 || !Number.isFinite(c)) return null;
    const H = Math.acos(Math.max(-1, Math.min(1, c))) * D;
    return noon + min((afterNoon ? 1 : -1) * H * 4);
  }
  const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * R))) * D;
  return {
    fajr: atAltitude(-17.7),
    sunrise: atAltitude(-0.833),
    dhuhr: noon + min(2),
    asr: atAltitude(asrAlt, true),
    sunset: atAltitude(-0.833, true),
    maghrib: atAltitude(-4.5, true),
    isha: atAltitude(-14, true),
  };
}
export function prayerTimes(date, lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Ogiltiga koordinater');
  const start = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const today = rawSolar(start, lat, lon);
  const yesterday = rawSolar(new Date(start.getTime() - 86400000), lat, lon);
  const tomorrow = rawSolar(new Date(start.getTime() + 86400000), lat, lon);
  const adjusted = [];
  // High latitude fallbacks; clearly signalled to users, not religious rulings.
  if (!today.sunrise || !today.sunset) throw new Error('Soluppgång eller solnedgång kan inte beräknas på denna breddgrad i dag.');
  const prevSunset = yesterday.sunset || today.sunrise - 18 * 3600000;
  const nextSunrise = tomorrow.sunrise || today.sunset + 12 * 3600000;
  const prevNight = today.sunrise - prevSunset;
  const nextNight = nextSunrise - today.sunset;
  let fajr = today.fajr;
  if (!fajr || fajr < prevSunset || fajr > today.sunrise) { fajr = today.sunrise - prevNight * 17.7 / 60; adjusted.push('Fajr'); }
  let maghrib = today.maghrib;
  if (!maghrib || maghrib < today.sunset || maghrib > nextSunrise) { maghrib = today.sunset + min(12); adjusted.push('Maghrib'); }
  let isha = today.isha;
  if (!isha || isha < today.sunset || isha > nextSunrise) { isha = today.sunset + nextNight * 14 / 60; adjusted.push('Isha'); }
  return { fajr, sunrise:today.sunrise, dhuhr: today.dhuhr, asr:today.asr, sunset:today.sunset, maghrib, isha, adjusted };
}
export function qiblaBearing(lat, lon) {
  const kaabaLat=21.4225*R, deltaLon=(39.8262-lon)*R, phi=lat*R;
  const theta=Math.atan2(Math.sin(deltaLon), Math.cos(phi)*Math.tan(kaabaLat)-Math.sin(phi)*Math.cos(deltaLon));
  return norm360(theta*D);
}
export function civilDate(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year:'numeric', month:'2-digit',day:'2-digit' }).formatToParts(now);
  const get = (key)=>Number(parts.find(p=>p.type===key)?.value);
  return {year:get('year'),month:get('month'),day:get('day')};
}
export function formatTime(timestamp, timeZone) {
  if (!Number.isFinite(timestamp)) return '–';
  return new Intl.DateTimeFormat('sv-SE',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(timestamp));
}
