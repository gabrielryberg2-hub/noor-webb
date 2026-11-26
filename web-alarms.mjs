import {prayerTimes,civilDate,formatTime} from './solar.mjs';
export const NAMES={fajr:'Fajr',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'};
const KEYS=Object.keys(NAMES), KEY='noor-web-alarms-v1', FIRED='noor-web-alarms-fired-v1';
export function cleanAlarmPrefs(v){return {enabled:v?.enabled===true,selected:KEYS.filter(k=>Array.isArray(v?.selected)?v.selected.includes(k):true),lead:[0,5,10,15].includes(v?.lead)?v.lead:0,sound:v?.sound==='silent'?'silent':'adhan',days:v?.days===7?7:30};}
const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
function shift(d,n){const x=new Date(Date.UTC(d.year,d.month-1,d.day+n));return {year:x.getUTCFullYear(),month:x.getUTCMonth()+1,day:x.getUTCDate()};}
export function occurrences(loc,prefs,now,days=2,includeRecent=false){
 const p=cleanAlarmPrefs(prefs),d=civilDate(new Date(now),loc.tz),out=[],skipped=[];
 // Adjacent civil days are needed for times around midnight and pre-alerts.
 for(let i=-1;i<days+1;i++){
  const day=shift(d,i);let s;try{s=prayerTimes(day,loc.lat,loc.lon);}catch{if(i>=0&&i<days)skipped.push(day);continue;}
  for(const k of p.selected){if(!Number.isFinite(s[k]))continue;const time=Math.floor(s[k]/60000)*60000;const at=time-p.lead*60000;
   if(at<(includeRecent?now-60000:now)||at>=now+days*86400000)continue;
   out.push({key:k,time,at,id:`${k}-${time}`,adjusted:s.adjusted.includes(NAMES[k])});}
 }
 return {events:out.sort((a,b)=>a.at-b.at),skipped};
}
const stamp=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function calendarFile(loc,prefs,now=Date.now()){
 const p=cleanAlarmPrefs(prefs),{events,skipped}=occurrences(loc,p,now,p.days);
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NOOR//Prayer reminders//SV','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:NOOR'];
 for(const e of events){lines.push('BEGIN:VEVENT',`UID:${e.id}@noor-web`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(e.time)}`,`DTEND:${stamp(e.time+60000)}`,`SUMMARY:NOOR - ${NAMES[e.key]}`,'DESCRIPTION:Kontrollera tiden mot din lokala kalender.','TRANSP:TRANSPARENT','BEGIN:VALARM',`TRIGGER:${p.lead?'-PT'+p.lead+'M':'PT0M'}`,'ACTION:DISPLAY',`DESCRIPTION:NOOR - ${NAMES[e.key]}`,'END:VALARM','END:VEVENT');}
 lines.push('END:VCALENDAR');return {text:lines.join('\r\n')+'\r\n',count:events.length,skipped:skipped.length};
}
export function dueEvents(events,now,fired={}){return events.filter(e=>e.at<=now&&e.at>now-60000&&!fired[`${e.id}-${e.at}`]);}
export function initPrayerAlarms(getLocation){
 const $=id=>document.getElementById(id),root=$('alarm-settings'),banner=$('alarm-banner'),audio=$('alarm-audio');
 if(!root||!banner||!audio)return;
 let prefs=cleanAlarmPrefs(read(KEY)),sessionSound=false,cacheKey='',cached=[],memoryFired={};
 const selected=Array.from(root.querySelectorAll('[data-alarm-prayer]'));
 $('alarm-enabled').checked=prefs.enabled;selected.forEach(el=>el.checked=prefs.selected.includes(el.value));$('alarm-lead').value=String(prefs.lead);$('alarm-sound').value=prefs.sound;$('alarm-days').value=String(prefs.days);
 const status=t=>{$('alarm-status').textContent=t;};
 const update=()=>{prefs=cleanAlarmPrefs({enabled:$('alarm-enabled').checked,selected:selected.filter(e=>e.checked).map(e=>e.value),lead:Number($('alarm-lead').value),sound:$('alarm-sound').value,days:Number($('alarm-days').value)});if(!prefs.enabled||prefs.sound==='silent'){audio.pause();}cacheKey='';if(!save(KEY,prefs))status('Inställningar kunde inte sparas.');tick();};
 root.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',update));
 async function play(){try{audio.currentTime=0;await audio.play();return true;}catch{return false;}}
 $('alarm-test').addEventListener('click',async()=>{sessionSound=await play();status(sessionSound?'Adhan spelas. Ljud är provat i denna öppna session.':'Ljudet kunde inte starta. Kontrollera ljudvolym och försök igen.');});
 $('alarm-stop').addEventListener('click',()=>{audio.pause();status('Ljud stoppat.');});
 $('alarm-dismiss').addEventListener('click',()=>{audio.pause();banner.hidden=true;});
 function tick(){
  const now=Date.now(),loc=getLocation();try{
   const day=civilDate(new Date(now),loc.tz),key=JSON.stringify([day,loc.lat,loc.lon,loc.tz,prefs.selected,prefs.lead]);
   if(key!==cacheKey){cached=occurrences(loc,prefs,now,2,true).events;cacheKey=key;}
   const next=cached.find(e=>e.at>now);
   $('alarm-next').textContent=!prefs.enabled?'Påminnelser i appen är avstängda.':next?`Nästa påminnelse: ${NAMES[next.key]} ${formatTime(next.at,loc.tz)} (${formatTime(next.time,loc.tz)} bönetid).`: 'Ingen kommande beräknad påminnelse.';
   if(!prefs.enabled||document.visibilityState!=='visible')return;
   const prev={...memoryFired,...(read(FIRED)||{})},fired=Object.fromEntries(Object.entries(prev).filter(([,t])=>Number.isFinite(t)&&t>now-3*86400000));
   const due=dueEvents(cached,now,fired);if(!due.length)return;
   for(const e of due)fired[`${e.id}-${e.at}`]=now;memoryFired=fired;save(FIRED,fired);
   $('alarm-message').textContent=due.map(e=>prefs.lead?`${NAMES[e.key]} om ${prefs.lead} min`:`Dags för ${NAMES[e.key]}`).join(' · ');banner.hidden=false;
   if(prefs.sound==='adhan'&&sessionSound&&prefs.lead===0)play().then(ok=>{if(!ok){sessionSound=false;status('Safari blockerade ljudet. Tryck på Testa Adhan igen.');}});
  }catch{$('alarm-next').textContent='Påminnelser kunde inte beräknas för vald plats.';}
 }
 $('alarm-export').addEventListener('click',async()=>{try{
  const result=calendarFile(getLocation(),prefs);if(!result.count){status('Inga framtida bönetider att exportera. Välj böner och kontrollera plats.');return;}
  const file=new File([result.text],'NOOR-bonepaminnelser.ics',{type:'text/calendar'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'NOOR bönepåminnelser'});}catch(e){if(e.name==='AbortError')return;throw e;}}
  else{const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  status(`${result.count} kalenderhändelser skapade. ${result.skipped?result.skipped+' dagar saknade beräkningsbara tider. ':''}Importera filen i en separat NOOR-kalender och kontrollera aviseringarna.`);
 }catch{status('Kalenderfilen kunde inte delas. Försök igen i Safari.');}});
 window.addEventListener('noor-date',tick);document.addEventListener('visibilitychange',tick);setInterval(tick,5000);tick();
}
