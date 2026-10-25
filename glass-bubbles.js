/* SPDX-License-Identifier: AGPL-3.0-only
 * Desk shader: TangfanOVO/qiaosi, scenes/windowsill/src/js/17-tags-camera-glass.js
 * https://github.com/TangfanOVO/qiaosi
 * Chat adapter 2026-10-26: same optical equations; wallpaper input, viewport budget,
 * one shared WebGL2 renderer and visible 2D bubble slices. No chat data/API access.
 * Corresponding source: assets/desk-chat-glass-source.zip
 */
(function(){
'use strict';
const messages=document.getElementById('messages'), app=document.querySelector('[data-glass-host]')||document.body;
if(!app||!messages||window.DeskChatGlass)return;
const gpu=document.createElement('canvas');
const gl=gpu.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
if(!gl){app.dataset.deskGlassStatus='webgl-unavailable';return;}
const DESK_FRAGMENT = "uniform sampler2D tDiffuse, tBlur; uniform vec2 uRes, uL; uniform vec4 uRects[28]; uniform float uRads[28], uAs[28], uShs[28]; uniform int uN; uniform float uPx, uNight, uTextLight; varying vec2 vUv;\n        float sdR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r; }\n        void main(){\n          vec2 px = vUv * uRes; vec4 base = texture2D(tDiffuse, vUv);\n          /* 画面上所有的玻璃（卡片、标注、按钮、拉杆面板……）：找离这个像素最近的那一块 */\n          float d = 1e5, uOn = 0., uRad = 0., shK = 0.; vec2 c = vec2(0.), hb = vec2(1.);\n          for (int i = 0; i < 28; i++){ if (i >= uN) break; vec4 r = uRects[i]; vec2 ci = r.xy + r.zw * .5, hi = r.zw * .5; float di = sdR(px - ci, hi, uRads[i]);\n            if (uAs[i] > .001 && di < d){ d = di; c = ci; hb = hi; uRad = uRads[i]; uOn = uAs[i]; shK = uShs[i]; } }\n          if (uOn < .001 || d > 34. * uPx){ gl_FragColor = base; return; }\n          if (d > 0.){                                                      /* 玻璃外：一圈很淡的接地影 */\n            float s = (exp(-d / (7. * uPx)) * .12 + exp(-d / (22. * uPx)) * .07) * shK;\n            gl_FragColor = vec4(base.rgb * (1. - s * uOn), 1.); return; }\n          vec2 g = vec2(sdR(px - c + vec2(1., 0.), hb, uRad) - sdR(px - c - vec2(1., 0.), hb, uRad), sdR(px - c + vec2(0., 1.), hb, uRad) - sdR(px - c - vec2(0., 1.), hb, uRad));\n          g /= max(length(g), 1e-4);                                        /* 朝外的方向 */\n          float bevel = min(20. * uPx, .32 * min(hb.x, hb.y)), t = clamp(-d / bevel, 0., 1.), e = 1. - t;\n          /* 贴边隆起：圆弧截面，越靠边坡越陡；把背后往里弯（中间 t=1 处完全不动） */\n          float slope = e * e * (1.6 - .6 * e);\n          vec2 off = -g * slope * min(18. * uPx, .9 * min(hb.x, hb.y));   /* 小块的玻璃（标注、按钮）边上弯得少一点 */\n          /* 整片玻璃是一块很薄的透镜：背后往中间收一点（放大一点点），再带一点不平整的波纹；\n             红绿蓝三色弯的程度不一样（色散），越靠边分得越开。不铺任何颜色、不压暗 */\n          vec2 rel = px - c;\n          vec2 lens = -rel * .018;\n          vec2 wav = vec2(sin(px.y / uPx * .045 + px.x / uPx * .012) + .5 * sin(px.x / uPx * .09 - 1.3), cos(px.x / uPx * .04 - px.y / uPx * .016) + .5 * cos(px.y / uPx * .08 + .7)) * .9 * uPx;\n          vec2 o = off + (lens + wav) * smoothstep(0., .6, t);\n          float disp = .012 + .035 * e;   // 色散只在边上一点点，像真玻璃那样淡\n          vec2 uR = (px + o * (1. + disp)) / uRes, uG = (px + o) / uRes, uB = (px + o * (1. - disp)) / uRes;\n          vec3 sharp = vec3(texture2D(tDiffuse, uR).r, texture2D(tDiffuse, uG).g, texture2D(tDiffuse, uB).b);\n          vec3 soft = vec3(textureLod(tBlur, uR, .8).r, textureLod(tBlur, uG, .8).g, textureLod(tBlur, uB, .8).b);\n          float body = smoothstep(.05, .75, t);\n          vec3 col = mix(sharp, soft, body * .62);   /* 只是一层很轻的磨砂，颜色都是背后自己的 */\n          /* 斜面上的光：朝光那一侧亮、背光那一侧暗；沿着周长强弱在变 */\n          float face = dot(g, uL), lip = smoothstep(.55, .95, e);\n          col += vec3(1., .99, .97) * lip * pow(max(face, 0.), 1.5) * (.42 - .22 * uNight);\n          col += vec3(1.) * smoothstep(.86, 1., e) * .14 * (1. - .5 * uNight);        /* 一根发丝那么细的亮边 */\n          col *= 1. - lip * max(-face, 0.) * .14;\n          float a = clamp(-d / (1.1 * uPx), 0., 1.) * uOn;                   /* 边缘抗锯齿 */\n          gl_FragColor = vec4(mix(base.rgb, col, a), 1.);\n        }";

const vertex='#version 300 es\nin vec2 position;out vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
const fragment='#version 300 es\nprecision highp float;\nout vec4 outColor;\n'+DESK_FRAGMENT.replace('varying vec2 vUv;','in vec2 vUv;').replaceAll('texture2D(','texture(').replaceAll('gl_FragColor','outColor');
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program,sharp,soft;
try{program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
function texture(unit,mips){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mips?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);return t;}
sharp=texture(0,false);soft=texture(1,true);
}catch(e){app.dataset.deskGlassStatus='shader-unavailable';console.warn('Desk chat glass could not initialize',e.message);return;}
window.DeskChatGlass={version:'1.0.0'};
const U=Object.fromEntries(['tDiffuse','tBlur','uRes','uRects','uRads','uAs','uShs','uN','uPx','uNight','uTextLight','uL'].map(n=>[n,gl.getUniformLocation(program,n)]));
const bg=document.createElement('canvas'),small=document.createElement('canvas');let ctx=bg.getContext('2d',{willReadFrequently:true}),smallCtx=small.getContext('2d');
const selector='.message-row .bubble:not(.oh-bare)',visible=new Set(),observed=new Set(),layers=new Map();
let frame=0,failed=false,urlKey=null,img=null,loading=false,bgKey='',lightSamples=null,settleUntil=0;
function queue(settle=false){if(settle)settleUntil=performance.now()+320;if(!frame&&!document.hidden&&!failed)frame=requestAnimationFrame(render);}
function removeLayer(b){const c=layers.get(b);if(c){c.remove();c.width=c.height=1;layers.delete(b);}b.classList.remove('desk-glass-ready');}
function clear(){for(const b of [...layers.keys()])removeLayer(b);}
function fail(reason){failed=true;clear();app.dataset.deskGlassStatus=reason;}
function imageSource(){const cs=getComputedStyle(app),match=cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/);return {cs,url:match?match[1]:''};}
function loadImage(url){urlKey=url;img=null;loading=!!url;bgKey='';if(!url)return;const image=new Image();if(!/^(blob:|data:)/.test(url))image.crossOrigin='anonymous';image.onload=()=>{if(urlKey!==url)return;img=image;loading=false;bgKey='';queue();};image.onerror=()=>{if(urlKey===url){loading=false;app.dataset.deskGlassStatus='wallpaper-unavailable';clear();}};image.src=url;}
function upload(unit,t,c,mipmap){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);if(mipmap)gl.generateMipmap(gl.TEXTURE_2D);}
function background(area,dpr){const {cs,url}=imageSource();if(url!==urlKey)loadImage(url);if(loading||(url&&!img))return false;
const ar=app.getBoundingClientRect();const key=[url,cs.backgroundColor,ar.x,ar.y,ar.width,ar.height,area.x,area.y,area.width,area.height,dpr].join('|');if(bgKey===key)return true;
bg.width=Math.max(1,Math.round(area.width*dpr));bg.height=Math.max(1,Math.round(area.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=cs.backgroundColor==='rgba(0, 0, 0, 0)'?'#f4f1f5':cs.backgroundColor;ctx.fillRect(0,0,area.width,area.height);
if(img){const scale=Math.max(ar.width/img.naturalWidth,ar.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,ar.left-area.left+(ar.width-w)/2,ar.top-area.top+(ar.height-h)/2,w,h);}
// Match the desk pass: quarter-size blur texture plus mip level 0.8.
small.width=Math.max(4,Math.round(bg.width/4));small.height=Math.max(4,Math.round(bg.height/4));smallCtx.drawImage(bg,0,0,small.width,small.height);upload(0,sharp,bg,false);upload(1,soft,small,true);
lightSamples=ctx.getImageData(0,0,bg.width,bg.height);bgKey=key;return true;}
function ink(rect,area,dpr){let light=0;for(let y=1;y<=3;y++)for(let x=1;x<=3;x++){const px=Math.max(0,Math.min(bg.width-1,Math.round((rect.left-area.left+rect.width*x/4)*dpr))),py=Math.max(0,Math.min(bg.height-1,Math.round((rect.top-area.top+rect.height*y/4)*dpr)));const i=(py*bg.width+px)*4,a=lightSamples.data;light+=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];}return light/9<140;}
function render(){frame=0;
if(document.hidden||(document.documentElement.dataset.bubbleStyle&&document.documentElement.dataset.bubbleStyle!=='glass')||!app.getClientRects().length||getComputedStyle(app).visibility==='hidden'){clear();return;}
const mr=messages.getBoundingClientRect(),vv=window.visualViewport;
const area={left:Math.max(0,mr.left),top:Math.max(vv?.offsetTop||0,mr.top),right:Math.min(innerWidth,mr.right),bottom:Math.min((vv?.offsetTop||0)+(vv?.height||innerHeight),mr.bottom)};area.x=area.left;area.y=area.top;area.width=area.right-area.left;area.height=area.bottom-area.top;if(area.width<1||area.height<1){clear();return;}
const dpr=Math.min(devicePixelRatio||1,1.5),active=[];
for(const b of visible){if(!b.isConnected||!b.matches(selector)||!b.getClientRects().length){removeLayer(b);continue;}const r=b.getBoundingClientRect();if(r.bottom<=area.top||r.top>=area.bottom||r.right<=area.left||r.left>=area.right||active.length>=28){removeLayer(b);continue;}active.push({b,r});}
if(!active.length){clear();return;}
try{if(!background(area,dpr)){clear();return;}
if(gpu.width!==bg.width||gpu.height!==bg.height){gpu.width=bg.width;gpu.height=bg.height;}gl.viewport(0,0,gpu.width,gpu.height);gl.useProgram(program);
const rects=new Float32Array(28*4),rads=new Float32Array(28),as=new Float32Array(28),shs=new Float32Array(28);
active.forEach(({b,r},i)=>{rects.set([(r.left-area.left)*dpr,(area.bottom-r.bottom)*dpr,r.width*dpr,r.height*dpr],i*4);rads[i]=Math.min(parseFloat(getComputedStyle(b).borderTopLeftRadius)||22,r.height/2,r.width/2)*dpr;as[i]=1;shs[i]=.6;});
gl.uniform1i(U.tDiffuse,0);gl.uniform1i(U.tBlur,1);gl.uniform2f(U.uRes,gpu.width,gpu.height);gl.uniform4fv(U.uRects,rects);gl.uniform1fv(U.uRads,rads);gl.uniform1fv(U.uAs,as);gl.uniform1fv(U.uShs,shs);gl.uniform1i(U.uN,active.length);gl.uniform1f(U.uPx,dpr);gl.uniform1f(U.uNight,1);gl.uniform2f(U.uL,-.55,.83);gl.drawArrays(gl.TRIANGLES,0,6);
for(const {b,r} of active){let c=layers.get(b);if(!c){c=document.createElement('canvas');c.className='desk-glass-slice';c.setAttribute('aria-hidden','true');b.prepend(c);layers.set(b,c);}
// Allocate just the visible slice even for a very long message.
const l=Math.max(area.left,r.left),t=Math.max(area.top,r.top),right=Math.min(area.right,r.right),bottom=Math.min(area.bottom,r.bottom);
const w=Math.max(1,Math.round((right-l)*dpr)),h=Math.max(1,Math.round((bottom-t)*dpr));if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;
c.style.cssText=`left:${l-r.left}px;top:${t-r.top}px;width:${right-l}px;height:${bottom-t}px`;
const cg=c.getContext('2d'),radius=(parseFloat(getComputedStyle(b).borderTopLeftRadius)||22)*dpr;cg.clearRect(0,0,w,h);cg.save();cg.beginPath();cg.roundRect((r.left-l)*dpr,(r.top-t)*dpr,r.width*dpr,r.height*dpr,radius);cg.clip();cg.drawImage(gpu,(l-area.left)*dpr,(t-area.top)*dpr,(right-l)*dpr,(bottom-t)*dpr,0,0,w,h);cg.restore();
const dark=ink(r,area,dpr);b.style.setProperty('--desk-glass-ink',dark?'#fffdf9':'#242126');b.style.setProperty('--desk-glass-text-shadow',dark?'0 1px 3px #000c':'0 1px 2px #ffffffb3');b.classList.add('desk-glass-ready');}
for(const b of [...layers.keys()])if(!active.some(x=>x.b===b))removeLayer(b);
app.dataset.deskGlassStatus='ready';if(performance.now()<settleUntil)queue();
}catch(e){console.warn('Desk chat glass paused:',e.message);fail('render-unavailable');}}
const resize=new ResizeObserver(()=>queue(true));
const io=new IntersectionObserver(entries=>{for(const e of entries){e.target.classList.toggle('is-glass-active',e.isIntersecting);if(e.isIntersecting){visible.add(e.target);resize.observe(e.target);}else{visible.delete(e.target);resize.unobserve(e.target);removeLayer(e.target);}}queue();},{root:messages,rootMargin:'0px'});
function track(){for(const b of messages.querySelectorAll(selector))if(!observed.has(b)){observed.add(b);io.observe(b);}for(const b of [...observed])if(!b.isConnected){io.unobserve(b);resize.unobserve(b);observed.delete(b);visible.delete(b);removeLayer(b);}}
track();
new MutationObserver(records=>{if(records.every(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.classList.contains('desk-glass-slice'))))return;track();queue(true);}).observe(messages,{childList:true,subtree:true,characterData:true});
new MutationObserver(()=>queue()).observe(app,{attributes:true,attributeFilter:['style','class','hidden']});
new MutationObserver(()=>queue()).observe(document.documentElement,{attributes:true,attributeFilter:['data-bubble-style','class','style','data-custom-bubble-colors']});
resize.observe(app);resize.observe(messages);messages.addEventListener('scroll',()=>queue(),{passive:true});window.addEventListener('resize',()=>queue(true),{passive:true});window.visualViewport?.addEventListener('resize',()=>queue(true));window.visualViewport?.addEventListener('scroll',()=>queue());
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;clear();}else queue();});
gpu.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('context-lost');});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;clear();});window.addEventListener('pageshow',()=>queue());
queue(true);
})();
