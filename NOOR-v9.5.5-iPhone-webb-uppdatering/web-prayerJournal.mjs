/** Optional local prayer diary. Markings are entered by the user, never inferred from device location or alarms.
 * No login, network, scoring, or background upload is involved.
 */
const PRAYER_KEYS=['fajr','dhuhr','asr','maghrib','isha'];
const ALLOWED=new Set(['done','qada','missed']);
function localDayKey(date){
 if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Invalid date');
 const y=String(date.getFullYear()).padStart(4,'0');
 const m=String(date.getMonth()+1).padStart(2,'0');
 const d=String(date.getDate()).padStart(2,'0');
 return `${y}-${m}-${d}`;
}
function keyDate(key){
 if(typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
 const [y,m,d]=key.split('-').map(Number);
 const date=new Date(2000,m-1,d,12,0,0,0);
 date.setFullYear(y); // new Date(0..99, ...) otherwise silently means 1900..1999
 return localDayKey(date)===key?date:null;
}
function shiftDayKey(key,days){
 const date=keyDate(key);
 if(!date||!Number.isInteger(days)||Math.abs(days)>10000)return null;
 date.setDate(date.getDate()+days);
 return localDayKey(date);
}
function cleanJournal(input){
 const src=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const result={};let kept=0;
 for(const [key,value] of Object.entries(src)){
  if(kept>=1500)break;
  if(!keyDate(key)||!value||typeof value!=='object'||Array.isArray(value))continue;
  const item={};
  for(const p of PRAYER_KEYS){if(ALLOWED.has(value[p]))item[p]=value[p];}
  if(typeof value.note==='string'&&value.note.trim())item.note=value.note.slice(0,280);
  if(Object.keys(item).length){result[key]=item;kept++;}
 }
 return result;
}
function setPrayerMark(journal,key,prayer,status){
 if(!keyDate(key)||!PRAYER_KEYS.includes(prayer)||!(status===null||ALLOWED.has(status)))return cleanJournal(journal);
 const result=cleanJournal(journal),day={...(result[key]||{})};
 if(status===null)delete day[prayer];else day[prayer]=status;
 if(Object.keys(day).length)result[key]=day;else delete result[key];
 return result;
}
function setJournalNote(journal,key,note){
 if(!keyDate(key))return cleanJournal(journal);
 const result=cleanJournal(journal),day={...(result[key]||{})};
 const safe=typeof note==='string'?note.slice(0,280):'';
 if(safe.trim())day.note=safe;else delete day.note;
 if(Object.keys(day).length)result[key]=day;else delete result[key];
 return result;
}
function periodStats(journal,today,days){
 const data=cleanJournal(journal);
 const todayKey=today instanceof Date?localDayKey(today):today;
 if(!keyDate(todayKey)||!Number.isInteger(days)||days<1||days>365)return null;
 let done=0,qada=0,missed=0,completeDays=0,markedDays=0;
 for(let i=0;i<days;i++){
  const key=shiftDayKey(todayKey,-i),entry=data[key]||{};
  let marked=0;
  for(const p of PRAYER_KEYS){if(entry[p]==='done'){done++;marked++;}else if(entry[p]==='qada'){qada++;marked++;}else if(entry[p]==='missed'){missed++;marked++;}}
  if(marked)markedDays++;
  if(marked===PRAYER_KEYS.length && PRAYER_KEYS.every(p=>entry[p]==='done'||entry[p]==='qada'))completeDays++;
 }
 return {done,qada,missed,total:done+qada,completeDays,markedDays,days};
}
/** Voluntary garden metaphor: only explicit marks count. An unmarked prayer never wilts a leaf.
 * Marking qada restores a leaf; any mark can be undone.
 */
function gardenStats(journal,today,days=7){
 const stats=periodStats(journal,today,days);
 if(!stats)return null;
 const grown=stats.done+stats.qada,fallen=stats.missed;
 const leaves=Math.max(0,grown-fallen);
 const stage=leaves>=18?3:leaves>=8?2:leaves>=2?1:0;
 return {...stats,grown,fallen,leaves,stage};
}
export {PRAYER_KEYS,localDayKey,shiftDayKey,cleanJournal,setPrayerMark,setJournalNote,periodStats,gardenStats};
