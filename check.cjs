const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/glass-bubbles.js','utf8');
const extracted=JSON.parse(code.match(/const DESK_FRAGMENT = (.*);/)[1]);assert.equal(extracted,fs.readFileSync(__dirname+'/desk-fragment.glsl','utf8'));
const callbacks=[],events={},draws=[];let glCalls=0,observer;
function classes(){const s=new Set();return {add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x),toggle:(x,on)=>on?s.add(x):s.delete(x)}}
const context={setTransform(){},fillRect(){},clearRect(){},save(){},beginPath(){},roundRect(){},clip(){},restore(){},drawImage(...a){draws.push(a)},getImageData(x,y,w,h){return {data:new Uint8Array(w*h*4)}}};
const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,getUniformLocation:(p,n)=>n,drawArrays(){glCalls++}}, {get:(o,k)=>k in o?o[k]:/^[A-Z_0-9]+$/.test(k)?1:()=>({})});
function canvas(){return {width:300,height:150,style:{},classList:classes(),setAttribute(){},getContext:k=>k==='webgl2'?gl:context,addEventListener(){},remove(){this.removed=true}}}
const app={dataset:{},getClientRects:()=>[1],getBoundingClientRect:()=>({x:0,y:0,left:0,top:0,width:390,height:844})};
const bounds={left:40,top:100,right:330,bottom:15100,width:290,height:15000};
const bubble={isConnected:true,matches:()=>true,getClientRects:()=>[1],getBoundingClientRect:()=>bounds,classList:classes(),style:{setProperty(){}},prepend(c){this.canvas=c}};
const messages={getBoundingClientRect:()=>({left:0,top:80,right:390,bottom:760}),querySelectorAll:()=>[bubble],addEventListener:(n,f)=>events[n]=f};
const root={dataset:{bubbleStyle:'glass'}};
const doc={hidden:false,documentElement:root,body:app,querySelector:()=>app,getElementById:n=>n==='chatApp'?app:messages,createElement:()=>canvas(),addEventListener:(n,f)=>events[n]=f};
const sandbox={console,document:doc,window:{addEventListener:(n,f)=>events[n]=f},innerWidth:390,innerHeight:844,devicePixelRatio:3,Image:class{},performance:{now:()=>1000},requestAnimationFrame:f=>(callbacks.push(f),callbacks.length),cancelAnimationFrame(){},getComputedStyle:()=>({backgroundImage:'none',backgroundColor:'rgb(10,10,10)',borderTopLeftRadius:'22px',visibility:'visible'}),ResizeObserver:class{observe(){}unobserve(){}},IntersectionObserver:class{constructor(f){observer=f}observe(){}unobserve(){}},MutationObserver:class{observe(){}}};
vm.runInNewContext(code,sandbox);observer([{target:bubble,isIntersecting:true}]);callbacks.shift()();assert.equal(glCalls,1);assert(bubble.classList.contains('desk-glass-ready'));assert(bubble.canvas.height<=1020,'Very long bubble must allocate viewport slice only');assert.equal(app.dataset.deskGlassStatus,'ready');
root.dataset.bubbleStyle='text';events.scroll();callbacks.shift()();assert(!bubble.classList.contains('desk-glass-ready'));assert(bubble.canvas.removed);
root.dataset.bubbleStyle='glass';events.scroll();callbacks.shift()();assert(bubble.classList.contains('desk-glass-ready'));
doc.hidden=true;events.visibilitychange();assert(!bubble.classList.contains('desk-glass-ready'));
observer([{target:bubble,isIntersecting:false}]);assert(!bubble.classList.contains('is-glass-active'));
console.log('PASS exact desk shader source; viewport-bounded 15000px message; style switch; hide and offscreen release. Mock runtime only, not GPU rendering.');
