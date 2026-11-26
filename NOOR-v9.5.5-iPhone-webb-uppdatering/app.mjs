import { initWebUpgrade } from './web-ui.mjs';
import { prayerTimes, qiblaBearing, civilDate, formatTime } from './solar.mjs';
const $=(id)=>document.getElementById(id);
const CITIES={
 kristianstad:['Kristianstad',56.0294,14.1567],malmo:['Malmö',55.605,13.0038],stockholm:['Stockholm',59.3293,18.0686],goteborg:['Göteborg',57.7089,11.9746],
 helsingborg:['Helsingborg',56.0465,12.6945],lund:['Lund',55.7047,13.191],uppsala:['Uppsala',59.8586,17.6389],jonkoping:['Jönköping',57.7826,14.1618],
 orebro:['Örebro',59.2753,15.2134],linkoping:['Linköping',58.4108,15.6214],vaxjo:['Växjö',56.8777,14.8091],umea:['Umeå',63.8258,20.263],lulea:['Luleå',65.5848,22.1547]
};
const safeRead=(key)=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
const safeSave=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Stockholm';
const defaultLoc={name:'Kristianstad (startort)',lat:56.0294,lon:14.1567,tz:'Europe/Stockholm',city:'kristianstad'};
const savedLoc=safeRead('noor-web-location-v1');
let loc=savedLoc&&Number.isFinite(savedLoc.lat)&&Number.isFinite(savedLoc.lon)?savedLoc:defaultLoc;
let schedule=null, scheduleKey='', currentTab='idag', heading=null, orientationListening=false, installPrompt=null;
let dhikr=Math.max(0,Math.min(100,Number(safeRead('noor-dhikr-total-v1'))||0));
const dua=[
 {arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',sv:'Vår Herre, ge oss det goda i detta liv och i det kommande, och skydda oss från Eldens straff.',ref:'Koranen 2:201'},
 {arabic:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',sv:'Min Herre, öppna mitt bröst och gör min uppgift lätt för mig.',ref:'Koranen 20:25–26'},
 {arabic:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً',sv:'Vår Herre, låt inte våra hjärtan vika av efter att Du väglett oss, och skänk oss barmhärtighet från Dig.',ref:'Koranen 3:8'},
 {arabic:'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',sv:'Ingen gud finns utom Du. Ära tillhör Dig. Jag har verkligen handlat orätt.',ref:'Koranen 21:87'},
 {arabic:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',sv:'Min Herre, låt mig och några av mina efterkommande upprätthålla bönen. Vår Herre, ta emot min bön.',ref:'Koranen 14:40'}
];
const PRAYERS=[{key:'fajr',name:'Fajr',desc:'Morgonbönen',icon:'☾'},{key:'sunrise',name:'Soluppgång',desc:'Fajr slutar',icon:'☀'},{key:'dhuhr',name:'Dhuhr',desc:'Middagsbönen',icon:'☀'},{key:'asr',name:'Asr',desc:'Eftermiddagsbönen',icon:'◉'},{key:'maghrib',name:'Maghrib',desc:'Kvällsbönen',icon:'◐'},{key:'isha',name:'Isha',desc:'Nattbönen',icon:'☾'}];
const PRAYER_KEYS=['fajr','dhuhr','asr','maghrib','isha'];
function formatDate(now){return new Intl.DateTimeFormat('sv-SE',{timeZone:loc.tz,day:'numeric',month:'long',year:'numeric'}).format(now);}
function refreshSchedule(){
 const now=new Date(), day=civilDate(now,loc.tz), key=`${day.year}-${day.month}-${day.day}|${loc.lat}|${loc.lon}`;
 if(scheduleKey!==key){scheduleKey=key;try{schedule=prayerTimes(day,loc.lat,loc.lon);$('prayer-list').removeAttribute('aria-busy');renderPrayers();}catch(err){schedule=null;$('prayer-list').textContent='Kunde inte beräkna bönetiderna: '+err.message;$('calc-note').textContent='Välj en annan plats eller kontrollera din platsinställning.';}}
 $('location-name').textContent=loc.name;
 $('date-label').textContent=formatDate(now);
 window.dispatchEvent(new CustomEvent('noor-date',{detail:{day, schedule, tz:loc.tz}}));
 updateUpcoming(now.getTime());
 updateQibla();
 const dayNum=Math.floor(Date.UTC(day.year,day.month-1,day.day)/86400000);
 const d=dua[((dayNum%dua.length)+dua.length)%dua.length];
 $('dua-arabic').textContent=d.arabic;$('dua-translation').textContent=d.sv+' (svensk återgivning)';$('dua-ref').textContent=d.ref;
}
function renderPrayers(){
 const list=$('prayer-list');list.replaceChildren();
 if(!schedule)return;
 const now=Date.now(), nextKey=PRAYER_KEYS.find(key=>schedule[key]>now);
 for(const prayer of PRAYERS){
   const row=document.createElement('div');row.className='prayer-row'+(prayer.key==='sunrise'?' sunrise':'')+(prayer.key===nextKey?' next':'');
   const icon=document.createElement('span');icon.className='prayer-icon';icon.textContent=prayer.icon;icon.setAttribute('aria-hidden','true');
   const info=document.createElement('span');info.className='prayer-info';const strong=document.createElement('strong');strong.textContent=prayer.name;const small=document.createElement('small');small.textContent=prayer.desc+(schedule.adjusted.includes(prayer.name)?' · justerad*':'');info.append(strong,small);
   const time=document.createElement('time');time.textContent=formatTime(schedule[prayer.key],loc.tz);
   if(Number.isFinite(schedule[prayer.key]))time.dateTime=new Date(schedule[prayer.key]).toISOString();
   row.append(icon,info,time);list.append(row);
 }
 $('calc-note').textContent=(schedule.adjusted.length?'* Hög latitud: '+schedule.adjusted.join(', ')+' har justerats med en förenklad metod. ':'')+'Astronomiska uppskattningar (Ja’fari); kontrollera alltid mot din lokala Shia-kalender.';
}
function updateUpcoming(now){
 if(!schedule){$('next-prayer-name').textContent='Ingen tid';$('next-prayer-time').textContent='--:--';$('next-countdown').textContent='Kontrollera vald plats';return;}
 let nextKey=PRAYER_KEYS.find(k=>schedule[k]>now), time=nextKey?schedule[nextKey]:null;
 if(!time){const d=civilDate(new Date(now),loc.tz);const tomorrowDate=new Date(Date.UTC(d.year,d.month-1,d.day)+86400000);const nextDay={year:tomorrowDate.getUTCFullYear(),month:tomorrowDate.getUTCMonth()+1,day:tomorrowDate.getUTCDate()};
 try{time=prayerTimes(nextDay,loc.lat,loc.lon).fajr;nextKey='fajr';}catch{time=null;}}
 const names={fajr:'Fajr',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'};
 $('next-prayer-name').textContent=names[nextKey]||'–';$('next-prayer-time').textContent=time?formatTime(time,loc.tz):'--:--';
 const distance=Math.max(0,time-now);const totalMinutes=Math.ceil(distance/60000),hours=Math.floor(totalMinutes/60),minutes=totalMinutes%60;
 $('next-countdown').textContent=time?`Om ${hours} tim ${minutes} min`:'Ingen kommande bön tillgänglig';
 const highlighted=document.querySelector('.prayer-row.next');if(highlighted&&highlighted.querySelector('.prayer-info strong')?.textContent!==names[nextKey])renderPrayers();
}
function chooseTab(tab){
 currentTab=tab;
 document.querySelectorAll('.tab-panel').forEach(panel=>{let active=panel.dataset.panel===tab;panel.hidden=!active;panel.classList.toggle('active',active);});
 document.querySelectorAll('.nav-link').forEach(button=>{let active=button.dataset.tab===tab;button.classList.toggle('active',active);active?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current');});
 if(tab==='qibla')updateQibla();
 window.dispatchEvent(new CustomEvent('noor-tab',{detail:tab}));
 if(document.documentElement.classList.contains('noor-standalone')) document.getElementById('app-content').scrollTop=0;
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>chooseTab(button.dataset.tab)));
$('settings-shortcut').addEventListener('click',()=>chooseTab('mer'));
const citySelect=$('city-select');if(loc.city&&CITIES[loc.city])citySelect.value=loc.city;
citySelect.addEventListener('change',()=>{
 const city=CITIES[citySelect.value];if(!city){citySelect.value=loc.city||'';return;}
 loc={name:city[0],lat:city[1],lon:city[2],tz:'Europe/Stockholm',city:citySelect.value};safeSave('noor-web-location-v1',loc);scheduleKey='';refreshSchedule();$('location-status').textContent='Platsen är nu '+loc.name+'.';chooseTab('idag');
});
$('get-location').addEventListener('click',()=>{
 if(!navigator.geolocation){$('location-status').textContent='Den här webbläsaren stöder inte platsåtkomst. Välj en stad i listan.';return;}
 $('location-status').textContent='Hämtar plats…';
 navigator.geolocation.getCurrentPosition(pos=>{
   loc={name:'Min plats',lat:pos.coords.latitude,lon:pos.coords.longitude,tz:zone,city:''};safeSave('noor-web-location-v1',loc);citySelect.value='';scheduleKey='';refreshSchedule();$('location-status').textContent='Platsen hämtad och sparad på din enhet.';chooseTab('idag');
 },err=>{$('location-status').textContent=err.code===1?'Tillåt platsåtkomst i webbläsaren eller välj en ort manuellt.':'Kunde inte hämta platsen. Välj en ort manuellt.';},{enableHighAccuracy:false,timeout:15000,maximumAge:900000});
});
function updateQibla(){
 const bearing=qiblaBearing(loc.lat,loc.lon);$('qibla-deg').textContent=Math.round(bearing)+'°';
 $('compass-needle').style.transform=`rotate(${heading===null?bearing:bearing-heading}deg)`;
 if(heading!==null)$('sensor-info').textContent='Livekompass aktiv. Håll mobilen plant och undvik metallföremål. Kompassen kan behöva kalibreras.';
}
function onOrientation(e){
 if(Number.isFinite(e.webkitCompassHeading)){heading=((e.webkitCompassHeading%360)+360)%360;updateQibla();return;}
 if(e.absolute&&Number.isFinite(e.alpha)){heading=((360-e.alpha)%360+360)%360;updateQibla();}
}
$('compass-btn').addEventListener('click',async()=>{
 try{
   if(typeof DeviceOrientationEvent==='undefined')throw new Error('Sensor saknas');
   if(typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted')throw new Error('Tillstånd saknas');}
   if(!orientationListening){window.addEventListener('deviceorientationabsolute',onOrientation,true);window.addEventListener('deviceorientation',onOrientation,true);orientationListening=true;}
   $('sensor-info').textContent='Väntar på kompassens riktning… Om inget händer, använd gradtalet från norr.';
 }catch{ $('sensor-info').textContent='Livekompassen är inte tillgänglig eller fick inte tillstånd. Använd gradtalet från geografiskt norr i stället.'; }
});
const dhikrSteps=[{arabic:'الله أكبر',word:'Allahu Akbar',start:0,target:34},{arabic:'الحمد لله',word:'Alhamdulillah',start:34,target:33},{arabic:'سبحان الله',word:'SubhanAllah',start:67,target:33}];
function renderDhikr(){
 const index=dhikr>=100?2:dhikr>=67?2:dhikr>=34?1:0;
 const s=dhikrSteps[index],count=dhikr>=100?33:dhikr-s.start;
 $('dhikr-stage').textContent=dhikr>=100?'FULLBORDAD':`${index+1} AV 3`;
 $('dhikr-arabic').textContent=s.arabic;$('dhikr-word').textContent=s.word;$('dhikr-count').textContent=count;$('dhikr-target').textContent='av '+s.target;
 $('dhikr-total').textContent=`${dhikr} / 100 totalt`; $('progress-fill').style.width=`${dhikr}%`;
 $('dhikr-ring').style.setProperty('--progress',`${Math.min(100,count/s.target*100)}%`);
 $('dhikr-status').textContent=dhikr>=100?'MashaAllah! Tasbih är fullbordad.':'Dina upprepningar sparas på mobilen.';
 $('dhikr-tap').disabled=dhikr>=100;
}
$('dhikr-tap').addEventListener('click',()=>{if(dhikr>=100)return;dhikr++;safeSave('noor-dhikr-total-v1',dhikr);if(navigator.vibrate)navigator.vibrate(13);renderDhikr();});
$('dhikr-reset').addEventListener('click',()=>{if(dhikr!==0&&!confirm('Vill du börja om din Tasbih?'))return;dhikr=0;safeSave('noor-dhikr-total-v1',dhikr);renderDhikr();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('install-android').addEventListener('click',async()=>{
 if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}
 $('install-android').textContent='Öppna Chrome-menyn och välj Installera app';
});
const openHelp=()=>{$('install-help').hidden=false;$('close-help').focus();};const closeHelp=()=>{$('install-help').hidden=true;$('install-ios').focus();};
$('install-ios').addEventListener('click',openHelp);$('close-help').addEventListener('click',closeHelp);$('done-help').addEventListener('click',closeHelp);
$('install-help').addEventListener('click',e=>{if(e.target===$('install-help'))closeHelp();});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('install-help').hidden)closeHelp();});
// The download is enabled only when the publisher has explicitly added a real release URL.
// A GitHub Releases asset is preferred to putting a large APK in the Pages repository.
if(location.protocol.startsWith('http'))fetch(new URL('download-config.json',location.href),{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(config=>{
  const url=String(config.androidApkUrl||'').trim();
  if(url&&/^https:\/\//i.test(url)){
   const a=$('apk-download');a.href=url;a.classList.remove('disabled');a.removeAttribute('aria-disabled');a.textContent='Ladda ner NOOR 9.5.5 för Android (APK)';
   $('apk-status').textContent='Android kan visa en säkerhetsvarning vid installation utanför Google Play. Ladda bara ner om du litar på utgivaren.';
  }
}).catch(()=>{});
$('apk-download').addEventListener('click',e=>{if($('apk-download').classList.contains('disabled'))e.preventDefault();});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
initWebUpgrade({ getLocation:()=>loc, getSchedule:()=>schedule, chooseTab, dua });
renderDhikr();refreshSchedule();window.setInterval(refreshSchedule,30000);
