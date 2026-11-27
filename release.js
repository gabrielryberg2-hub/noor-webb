// Fyll endast i efter att en offentlig, rättighetskontrollerad APK har godkänts.
const release = { apkUrl: '', version: '' };
if (release.apkUrl && release.version) {
  const url = new URL(release.apkUrl, location.href);
  if (url.protocol === 'https:' && url.pathname.toLowerCase().endsWith('.apk')) {
    const link = document.createElement('a'); link.className = 'download'; link.href = url.href;
    link.textContent = 'Ladda ner Android · ' + release.version;
    document.getElementById('download').replaceChildren(link);
  }
}
