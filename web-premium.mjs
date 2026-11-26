import {cleanJournal,PRAYER_KEYS,shiftDayKey} from './web-prayerJournal.mjs';
const milestones=[{days:7,name:'Gyllene lykta'},{days:14,name:'Olivlund'},{days:30,name:'Marmorfontän'},{days:100,name:'Paviljong'},{days:365,name:'Stora oasen'}];
const themes={Signature:['#091E19','#16382D','#081C17'],Midnight:['#0A1020','#202D49','#090E19'],Ivory:['#30291F','#62533D','#30291F'],Karbala:['#231015','#6A2835','#231015'],Najaf:['#153B3B','#265C5B','#102D2D'],AMOLED:['#000000','#151515','#000000']};
function monthly(journal,today){const data=cleanJournal(journal);return Array.from({length:30},(_,i)=>{const date=shiftDayKey(today,i-29);return {date,count:PRAYER_KEYS.filter(p=>data[date]?.[p]==='done').length};});}
function unlocks(best,previous=[]){return milestones.filter(m=>best>=m.days||previous.includes(m.days)).map(m=>m.days);}
function hijri(date){try{return new Intl.DateTimeFormat('sv-SE-u-ca-islamic-civil',{day:'numeric',month:'long',year:'numeric'}).format(date);}catch{return null;}}
export {milestones,themes,monthly,unlocks,hijri};
