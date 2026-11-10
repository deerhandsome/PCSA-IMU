/* Faithful browser port of the bundled preprocess.py relevant forward path.
   Exact 20Hz / 120 samples, float32 tensors. */
const COEF=[0.0020805671354922925,0.004161134270984585,0.0020805671354922925,1,-1.866892279711715,0.875214548253684];
const ZI=[0.9979194328645024,-0.8731339811181871];
function filt(x){let z0=ZI[0]*x[0],z1=ZI[1]*x[0],y=new Float64Array(x.length);for(let i=0;i<x.length;i++){let v=x[i],o=COEF[0]*v+z0;z0=COEF[1]*v-COEF[4]*o+z1;z1=COEF[2]*v-COEF[5]*o;y[i]=o;}return y;}
function filtfilt(x){const pad=6,n=x.length;const a=new Float64Array(n+2*pad);for(let i=0;i<pad;i++){a[i]=2*x[0]-x[pad-i];a[n+pad+i]=2*x[n-1]-x[n-2-i];}a.set(x,pad);const f=filt(a);const b=filt(Float64Array.from(f).reverse()).reverse();return b.slice(pad,pad+n);}
function norm(x){return Math.hypot(...x)}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0)}
function quantile(v,q){let a=[...v].sort((x,y)=>x-y),t=(a.length-1)*q,l=Math.floor(t),h=Math.ceil(t);return a[l]+(a[h]-a[l])*(t-l)}
function rot(a){const mag=norm(a);a=mag<=1e-12?[0,0,1]:a.map(x=>x/mag);const b=[0,0,1],v=cross(a,b),c=dot(a,b),s=norm(v);if(s<1e-12){if(c>0)return [[1,0,0],[0,1,0],[0,0,1]];let axis=cross(a,[1,0,0]);if(norm(axis)<1e-12)axis=cross(a,[0,1,0]);axis=axis.map(x=>x/norm(axis));return Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>(i===j?-1:0)+2*axis[i]*axis[j]));}const k=[[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]],kk=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>dot(k[i],[k[0][j],k[1][j],k[2][j]])));return Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>(i===j?1:0)+k[i][j]+kk[i][j]*(1-c)/(s*s)));}
function gravity(arr){let x=Array.from({length:3},(_,j)=>arr.map(r=>r[j]));const lp=x.map(v=>filtfilt(v).reduce((s,a)=>s+a,0)/120);const abs=lp.map(Math.abs),sorted=[...abs].sort((a,b)=>a-b),dom=abs.indexOf(Math.max(...abs));return {lp,dom,ratio:abs[dom]/Math.max(1e-6,sorted[1])}}
export function prepare(raw){
 if(raw.length!==120||raw.some(r=>r.length!==6||r.some(v=>!Number.isFinite(v))))throw Error('Invalid 120x6 raw window');
 // numpy preprocess.align_windows converts original values to float32 first
 let arr=raw.map(r=>r.map(Math.fround));
 const lengths=arr.map(r=>Math.hypot(r[0],r[1],r[2])),g0=gravity(arr),med=quantile(lengths,.5),mx=Math.max(...lengths);
 const mode=mx>17||med>12?'seg3_like':g0.ratio<1.15?'seg2_like':g0.dom===0?'seg4_like':'seg1_like';
 if(mode==='seg3_like'){
  const limits=Array.from({length:3},(_,j)=>[quantile(arr.map(r=>r[j]),.01),quantile(arr.map(r=>r[j]),.99)]);
  arr=arr.map(r=>r.map((v,j)=>j<3?Math.max(limits[j][0],Math.min(limits[j][1],v)):v));
 }
 const R=rot(gravity(arr).lp);
 const a=new Float32Array(360),g=new Float32Array(360);
 for(let i=0;i<120;i++)for(let j=0;j<3;j++){
  a[i*3+j]=Math.fround(dot(R[j],arr[i].slice(0,3)));
  g[i*3+j]=Math.fround(dot(R[j],arr[i].slice(3,6)));
 }
 const mean=[0,0,0];for(let i=0;i<120;i++)for(let j=0;j<3;j++)mean[j]+=a[i*3+j]/120;
 const denom=Math.max(norm(mean),.1),c=Array.from({length:8},()=>new Float32Array(120));
 for(let i=0;i<120;i++){
  const av=[a[i*3]/denom,a[i*3+1]/denom,a[i*3+2]/denom],gv=[g[i*3],g[i*3+1],g[i*3+2]];
  const ii=i===0?0:i-1,pr=[a[ii*3]/denom,a[ii*3+1]/denom,a[ii*3+2]/denom],pg=[g[ii*3],g[ii*3+1],g[ii*3+2]];
  const values=[av[2],Math.hypot(av[0],av[1]),norm(av),gv[2],Math.hypot(gv[0],gv[1]),norm(gv),norm(av.map((v,j)=>v-pr[j])),norm(gv.map((v,j)=>v-pg[j]))];
  values.forEach((v,j)=>c[j][i]=Math.fround(v));
 }
 const z=new Float32Array(960),stats=new Float32Array(32),spec=new Float32Array(488);
 for(let k=0;k<8;k++){
  let mu=0;for(let i=0;i<120;i++)mu+=c[k][i]/120;
  let variance=0;for(let i=0;i<120;i++){c[k][i]=Math.fround(c[k][i]-mu);variance+=c[k][i]*c[k][i]/120;}
  const sd=Math.max(Math.sqrt(variance),1e-4);let m3=0,m4=0,amax=0;
  for(let i=0;i<120;i++){
   const v=Math.fround(Math.max(-8,Math.min(8,c[k][i]/sd)));z[k*120+i]=v;m3+=v*v*v/120;m4+=v*v*v*v/120;amax=Math.max(amax,Math.abs(v));
  }
  stats[k]=Math.fround(Math.log(sd));stats[8+k]=Math.fround(m3);stats[16+k]=Math.fround(Math.min(m4,40));stats[24+k]=Math.fround(amax);
  let powers=new Float64Array(61),sum=0;
  for(let f=0;f<=60;f++){
   let re=0,im=0;for(let t=0;t<120;t++){
    const v=z[k*120+t]*(0.5-0.5*Math.cos(2*Math.PI*t/120));const angle=2*Math.PI*f*t/120;
    re+=v*Math.cos(angle);im-=v*Math.sin(angle);
   }
   powers[f]=re*re+im*im;sum+=powers[f];
  }
  for(let f=0;f<=60;f++)spec[k*61+f]=Math.fround(Math.log1p(100*powers[f]/Math.max(sum,1e-6)));
 }
 return {physical_z:z,log_power:spec,statistics:stats};
}
