// Initial great-circle direction relative to geographic north; no location transmission.
const KAABA={lat:21.422487,lon:39.826206};
const rad=Math.PI/180;
const normalize=x=>((x%360)+360)%360;
const delta=(target,heading)=>normalize(target-heading+180)-180;
function qiblaInfo(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const a=lat*rad,b=KAABA.lat*rad,d=(KAABA.lon-lon)*rad;
 const h=Math.min(1,Math.max(0,Math.sin((b-a)/2)**2+Math.cos(a)*Math.cos(b)*Math.sin(d/2)**2));
 const central=2*Math.asin(Math.sqrt(h));
 const distance=central*6371.0088;
 const y=Math.sin(d)*Math.cos(b),x=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d);
 return {bearing:distance<0.01||Math.abs(Math.PI-central)<1e-7||Math.abs(lat)===90?null:normalize(Math.atan2(y,x)/rad),distance};
}
function smoothHeading(previous,next,weight=.35){return Number.isFinite(previous)?normalize(previous+delta(next,previous)*weight):normalize(next);}
function headingSample(sample){
 const valid=x=>Number.isFinite(x)&&x>=0&&x<=360;
 const trueNorth=valid(sample.trueHeading),magnetic=valid(sample.magHeading);
 if(!trueNorth&&!magnetic)return null;
 return {angle:normalize(trueNorth?sample.trueHeading:sample.magHeading),source:trueNorth?'true':'magnetic',accuracy:Number.isFinite(sample.accuracy)?sample.accuracy:0};
}
function guidance(info,sample,now,locationConfirmed){
 if(!info||!Number.isFinite(info.bearing))return {mode:'unavailable',diff:null};
 if(!sample||now-sample.at>3000||now<sample.at-1000)return {mode:'north',diff:null};
 const diff=delta(info.bearing,sample.angle);
 if(sample.source!=='true'||sample.accuracy<3||!locationConfirmed)return {mode:'approximate',diff};
 return {mode:'live',diff};
}
export {qiblaInfo,normalize,delta,smoothHeading,headingSample,guidance};
