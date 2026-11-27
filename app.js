'use strict';
const stage=document.querySelector('#stage'), msg=document.querySelector('#message');let scene,frame=1,stream=null,photos=[],result='',busy=false,epoch=0;// Cache busting: refresh frame URLs once per page load, preserving reuse within the session.
const FRAME_CACHE_VERSION=Date.now().toString(36);
const A=n=>'assets/'+encodeURIComponent(n+'.png')+(n.startsWith('CHECHEBOOTH_FRAMES_')?'?v='+FRAME_CACHE_VERSION:'');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Film-inspired profiles: saturation, contrast, lift, warmth RGB, grain, hue treatment.
const recipes=[
 ['B&W'],['COLOR'],['PORTRA 400 V2',.94,.91,8,9,2,-10,5,0],
 ['EASY REALA ACE',.98,1.02,2,1,0,-2,2,0],
 ['CLASSIC COLOR',1.16,.94,5,8,3,-9,5,1],
 ['CINESTILL 800T',.87,1.17,0,-5,6,1,3,2],
 ['CALIFORNIA SUMMER',1.12,.87,9,10,5,-9,2,1],
 ['BRIGHT SUMMER',1.24,.89,7,4,5,-8,0,1],
 ['ASTIA SUMMER',1.12,.91,6,7,2,-5,2,0],
 ['AGFA VISTA 100',.98,1.06,4,-4,5,-5,5,1],
 ['AEROCHROME V1',1.20,1.18,0,4,0,-2,5,3],
 ['AEROCHROME V2',1.10,.94,8,0,0,4,5,4],
 ['ACROS',0,1.35,0,0,0,0,0,0],
 ['SUMMER 1970',.76,.88,9,9,5,-12,9,1]
];
let recipe=0, previewRAF=0;
function film(ctx,w,h,grain=true){
 if(recipe===1)return;
 const d=ctx.getImageData(0,0,w,h), a=d.data;
 const [name,sat,con,lift,wr,wg,wb,noise,mode]=recipes[recipe];
 for(let k=0;k<a.length;k+=4){
  let r=a[k],g=a[k+1],b=a[k+2],y=.299*r+.587*g+.114*b;
  if(recipe===0){a[k]=a[k+1]=a[k+2]=Math.round(y);continue;}
  let green=Math.max(0,Math.min(1,(g-Math.max(r,b)-8)/55));
  let blue=Math.max(0,Math.min(1,(b-r-12)/75));
  if(mode===3||mode===4){let m=Math.min(1,green*1.45); r=r*(1-m)+Math.min(255,g*(mode===4?1.25:1.45))*m; b=b*(1-m)+g*(mode===4?1.02:.20)*m;g=g*(1-m)+g*(mode===4?.48:.12)*m; if(mode===3){g-=blue*12;b+=blue*12;}else{g+=blue*45;b-=blue*16;r-=blue*10;}}
  if(mode===1){g+=blue*13;b-=blue*7;}
  if(mode===2){g+=8*(1-y/255);r-=5*(1-y/255);}
  y=.299*r+.587*g+.114*b;
  const n=grain?(Math.random()-.5)*noise*2:0;
  const tone=v=>(v-128)*con+128+lift+n;
  a[k]=tone(y+(r-y)*sat)+wr;a[k+1]=tone(y+(g-y)*sat)+wg;a[k+2]=tone(y+(b-y)*sat)+wb;
 }
 ctx.putImageData(d,0,0);
}

function pos(el,x,y,w,h){Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});return el}
function img(n,x,y,w,h,cls='',parent=scene){let e=new Image();e.src=A(n);e.alt='';e.className='asset '+cls;parent.append(pos(e,x,y,w,h));return e}
function btn(n,label,x,y,w,h,fn,cls=''){let e=document.createElement('button');e.className='control '+cls;e.setAttribute('aria-label',label);let i=new Image();i.src=A(n);i.alt=label;e.append(i);scene.append(pos(e,x,y,w,h));e.onclick=fn;return e}
function text(s,x,y,w,h){let e=document.createElement('div');e.className='status';e.textContent=s;scene.append(pos(e,x,y,w,h));return e}
function resize(){const scale=Math.min(stage.clientHeight/1080,stage.clientWidth/(stage.clientWidth/stage.clientHeight<1.35?720:1920));stage.style.setProperty('--scale',scale);const edge=(1920-stage.clientWidth/scale)/2;stage.style.setProperty('--left-edge',edge+'px');stage.style.setProperty('--right-edge', (1920-edge)+'px');}window.addEventListener('resize',resize);resize();
function base(titleY=102){epoch++;msg.textContent='';stage.replaceChildren();scene=document.createElement('section');scene.className='scene';stage.append(scene);img('CHECHEBOOTH-FONDO_GRAFICO IZQUIERDO',0,0,418,433,'edge-left');img('CHECHEBOOTH-FONDO_GRAFICO DERECHO',1519,0,401,223,'edge-right');img('CHECHEBOOTH-FONDO_GRAFICO IZQUIERDO ABAJO',130,847,130,127);img('CHECHEBOOTH-FONDO_GRAFICO DERECHO ABAJO',1480,979,168,101);img('CHECHEBOOTH-FONDO_LOGO DERECHOABAJO',1740,900,158,158);img('TITULAR CHECHEBOOTH',754,titleY,412,70);btn('CHECHEJPG INSTAGRAM','Instagram de CHECHE.JPG',861,1018,197,30,()=>window.open('https://www.instagram.com/_cheche.jpg/','_blank','noopener'));}
function stars(x=675,y=240,right=1160){img('DESTELLOS2',x,y,73,98,'spark');img('DESTELLOS1',right,545,38,87,'spark')}
function stop(){cancelAnimationFrame(previewRAF);previewRAF=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
function home(){stop();busy=false;photos=[];result='';base();img('CHECHEBOOTH-HOME',768,214,384,633);stars();btn('BOTON ENTER','Entrar',884,890,152,52,async()=>{if(busy)return;busy=true;img('FLASH OVALO',881,231,159,115,'flash');await wait(350);busy=false;selector()},'pulse')}
const frameName=()=>`CHECHEBOOTH_FRAMES_${frame}`;
function selector(){base();stars(670,180,1220);img('BOOTH-SIN-TEMPLATES',717,247,486,480);let strip=img(frameName(),881,275,158,420,'strip');strip.style.background='#fff';function change(d){frame=(frame-1+d+7)%7+1;strip.src=A(frameName());counter.textContent=frame+' / 7'}btn('FLECHA-IZQUIERDA','Marco anterior',829,460,30,55,()=>change(-1));btn('FLECHA-DERECHA','Marco siguiente',1061,460,30,55,()=>change(1));let counter=text(frame+' / 7',900,730,120,30);btn('SIGUIENTE-BOTON','Siguiente',884,837,152,47,()=>capture(true));img('TEXTOS ',663,920,594,73)}
async function capture(choosing=true){stop();base();stars(650,170,1260);img('CHECHEBOOTH-22',676,247,568,561);let hand=img('DIBUJO MANO2',1078,834,211,169);hand.style.display=choosing?'none':'';let video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;video.className='asset preview';scene.append(pos(video,767,272,386,512));let live=document.createElement('canvas');live.width=290;live.height=368;live.className='asset preview';live.style.transform='none';live.style.objectFit='fill';live.style.display='none';scene.append(pos(live,767,272,386,512));let lc=live.getContext('2d',{willReadFrequently:true});let last=0;function preview(t){if(token!==epoch||!stream)return;if(t-last>=65&&video.videoWidth){last=t;let sw=video.videoWidth,sh=video.videoHeight,ratio=live.width/live.height;if(sw/sh>ratio)sw=sh*ratio;else sh=sw/ratio;lc.setTransform(-1,0,0,1,live.width,0);lc.drawImage(video,(video.videoWidth-sw)/2,(video.videoHeight-sh)/2,sw,sh,0,0,live.width,live.height);film(lc,live.width,live.height,false);live.style.display='block';}previewRAF=requestAnimationFrame(preview);}let status=text('Activa tu cámara',790,895,340,35);
let take=btn('TAKE THE PIC BOTON','Tomar cuatro fotos',873,838,173,46,shoot);take.disabled=true;take.style.display=choosing?'none':'';
let back=btn('VOLVER-BOTON','Volver',680,940,130,45,()=>{if(choosing){stop();selector()}else{showChoice()}});
let label=text(recipes[recipe][0],820,815,280,30);label.style.fontSize='22px';label.setAttribute('aria-live','polite');
let filterCount=text((recipe+1)+' / '+recipes.length,900,847,120,26);filterCount.style.fontSize='16px';
function changeRecipe(d){recipe=(recipe+d+recipes.length)%recipes.length;label.textContent=recipes[recipe][0];filterCount.textContent=(recipe+1)+' / '+recipes.length;last=-Infinity;}
let prev=btn('FLECHA-IZQUIERDA','Filtro anterior',790,817,22,30,()=>changeRecipe(-1));
let next=btn('FLECHA-DERECHA','Filtro siguiente',1108,817,22,30,()=>changeRecipe(1));
let ready=false;
let done=btn('LISTO-BOTON','Listo',894,880,131,45,()=>{if(ready){choosing=false;layout()}else{capture(true)}});done.disabled=true;
function layout(){for(let e of [label,filterCount,prev,next,done])e.style.display=choosing?'':'none';take.style.display=choosing?'none':'';hand.style.display=choosing?'none':'';status.style.display=choosing&&ready?'none':'';status.style.top=(choosing?930:895)+'px';status.textContent=ready?'0 / 4 fotos':'Activa tu cámara';}
function showChoice(){choosing=true;layout()}
layout();let token=epoch;try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Se necesita HTTPS o localhost');let s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});if(token!==epoch){s.getTracks().forEach(t=>t.stop());return}stream=s;video.srcObject=s;await video.play();if(token!==epoch)return;ready=true;previewRAF=requestAnimationFrame(preview);take.disabled=false;done.disabled=false;layout()}catch(e){if(token!==epoch)return;status.textContent='Cámara no disponible';msg.textContent='Permite el acceso a la cámara. Usa HTTPS o localhost y vuelve a intentar.';take.disabled=false;take.onclick=()=>capture(false);done.disabled=false;done.onclick=()=>capture(true)}
async function shoot(){if(busy||choosing||!ready||!video.videoWidth)return;busy=true;take.disabled=true;back.disabled=true;photos=[];try{for(let i=0;i<4;i++){for(let j=3;j>=1;j--){let n=img(String(j),922,455,76,135,'count');await wait(1000);n.remove()}let c=document.createElement('canvas');c.width=388;c.height=492;let ctx=c.getContext('2d');let ratio=c.width/c.height,sw=video.videoWidth,sh=video.videoHeight;if(sw/sh>ratio)sw=sh*ratio;else sh=sw/ratio;ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(video,(video.videoWidth-sw)/2,(video.videoHeight-sh)/2,sw,sh,0,0,c.width,c.height);film(ctx,c.width,c.height);photos.push(c);let f=document.createElement('div');f.className='asset flash';f.style.background='white';scene.append(pos(f,767,272,386,512));status.textContent=`${i+1} / 4 fotos`;await wait(450);f.remove()}stop();await compose();printing()}catch(e){stop();msg.textContent='No se pudo completar la captura. Intenta nuevamente.';back.disabled=false;take.disabled=false;take.onclick=()=>capture(false)}finally{busy=false}}
}
async function compose(){let c=document.createElement('canvas');c.width=600;c.height=2200;let ctx=c.getContext('2d');let ys=[53,571,1088,1605].map(y=>y+([5,6].includes(frame)?13:0));photos.forEach((p,i)=>ctx.drawImage(p,105,ys[i]-1,390,494));let overlay=new Image();overlay.src=A(frameName());await overlay.decode();ctx.drawImage(overlay,0,0);result=c.toDataURL('image/png')}
function resultImage(x,y,w,h,parent=scene,cls=''){let e=new Image();e.src=result;e.alt='Tu tira de cuatro fotografías';e.className='asset strip '+cls;parent.append(pos(e,x,y,w,h));return e}
function printing(){base(135);stars(690,260);img('BOOTH PRINT',765,350,389,548);img('PRINTING BOTON',874,285,172,47);let windowEl=document.createElement('div');windowEl.className='slot';windowEl.style.background='transparent';scene.append(pos(windowEl,845,514,230,255));resultImage(75,0,80,253,windowEl,'paper');img('RANURA NEGRA',844,495,231,28);let pick=btn('PICK UP BOTON','Recoger fotos',874,920,172,47,finalScreen);pick.disabled=true;let token=epoch;setTimeout(()=>{if(token===epoch){pick.disabled=false;pick.classList.add('pulse')}},4100)}
function finalScreen(){base(125);img('PHOTOSTRIP LISTO',839,220,241,46);resultImage(897,285,126,462);img('DIBUJO MANO1',1145,805,129,136);img('DESTELLOS2',690,830,73,98,'spark');btn('DESCARGA BOTON','Descargar PNG',864,765,192,46,download);btn('COMPARTELO BOTON','Compartir',855,835,209,46,share);btn('OTRA VEZ BOTON','Volver a empezar',869,905,182,47,()=>{frame=1;recipe=0;home()})}
function download(){let a=document.createElement('a');a.href=result;a.download='chechejpg-photostrip.png';a.click()}
async function share(){try{let blob=await(await fetch(result)).blob();let file=new File([blob],'chechejpg-photostrip.png',{type:'image/png'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'CHECHE.JPG BOOTH'})}else{download();msg.textContent='Imagen descargada. Puedes compartirla desde tu galería.'}}catch(e){if(e.name!=='AbortError')msg.textContent='No se pudo compartir. Usa DESCARGA.'}}
window.addEventListener('pagehide',stop);home();
