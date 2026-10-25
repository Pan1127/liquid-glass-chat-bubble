/*! Liquid glass adapted from TangfanOVO/qiaosi, AGPL-3.0-only. */
// Source: scenes/windowsill/src/js/17-tags-camera-glass.js
// Modifications: module export, cross-shadow-root rectangle synchronization, resource disposal.
import * as THREE from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
const GLASS_N = 28;   // 画面上最多多少块玻璃
export class GlassPass extends Pass {
  constructor(){
    super();
    this.blurRT = new THREE.WebGLRenderTarget(4, 4, {generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false});
    this.copy = new FullScreenQuad(new THREE.ShaderMaterial({uniforms: {tDiffuse: {value: null}},
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }', depthTest: false, depthWrite: false}));
    this.uniforms = {tDiffuse: {value: null}, tBlur: {value: this.blurRT.texture}, uRes: {value: new THREE.Vector2(1, 1)},
      uRects: {value: Array.from({length: GLASS_N}, () => new THREE.Vector4())}, uRads: {value: new Array(GLASS_N).fill(0)}, uAs: {value: new Array(GLASS_N).fill(0)}, uShs: {value: new Array(GLASS_N).fill(0)}, uN: {value: 0},
      uPx: {value: 2}, uNight: {value: 0}, uTextLight: {value: 0}, uL: {value: new THREE.Vector2(-.55, .83)}};
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({uniforms: this.uniforms, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse, tBlur; uniform vec2 uRes, uL; uniform vec4 uRects[${GLASS_N}]; uniform float uRads[${GLASS_N}], uAs[${GLASS_N}], uShs[${GLASS_N}]; uniform int uN; uniform float uPx, uNight, uTextLight; varying vec2 vUv;
        float sdR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r; }
        void main(){
          vec2 px = vUv * uRes; vec4 base = texture2D(tDiffuse, vUv);
          /* 画面上所有的玻璃（卡片、标注、按钮、拉杆面板……）：找离这个像素最近的那一块 */
          float d = 1e5, uOn = 0., uRad = 0., shK = 0.; vec2 c = vec2(0.), hb = vec2(1.);
          for (int i = 0; i < ${GLASS_N}; i++){ if (i >= uN) break; vec4 r = uRects[i]; vec2 ci = r.xy + r.zw * .5, hi = r.zw * .5; float di = sdR(px - ci, hi, uRads[i]);
            if (uAs[i] > .001 && di < d){ d = di; c = ci; hb = hi; uRad = uRads[i]; uOn = uAs[i]; shK = uShs[i]; } }
          if (uOn < .001 || d > 34. * uPx){ gl_FragColor = base; return; }
          if (d > 0.){                                                      /* 玻璃外：一圈很淡的接地影 */
            float s = (exp(-d / (7. * uPx)) * .12 + exp(-d / (22. * uPx)) * .07) * shK;
            gl_FragColor = vec4(base.rgb * (1. - s * uOn), 1.); return; }
          vec2 g = vec2(sdR(px - c + vec2(1., 0.), hb, uRad) - sdR(px - c - vec2(1., 0.), hb, uRad), sdR(px - c + vec2(0., 1.), hb, uRad) - sdR(px - c - vec2(0., 1.), hb, uRad));
          g /= max(length(g), 1e-4);                                        /* 朝外的方向 */
          float bevel = min(20. * uPx, .32 * min(hb.x, hb.y)), t = clamp(-d / bevel, 0., 1.), e = 1. - t;
          /* 贴边隆起：圆弧截面，越靠边坡越陡；把背后往里弯（中间 t=1 处完全不动） */
          float slope = e * e * (1.6 - .6 * e);
          vec2 off = -g * slope * min(18. * uPx, .9 * min(hb.x, hb.y));   /* 小块的玻璃（标注、按钮）边上弯得少一点 */
          /* 整片玻璃是一块很薄的透镜：背后往中间收一点（放大一点点），再带一点不平整的波纹；
             红绿蓝三色弯的程度不一样（色散），越靠边分得越开。不铺任何颜色、不压暗 */
          vec2 rel = px - c;
          vec2 lens = -rel * .018;
          vec2 wav = vec2(sin(px.y / uPx * .045 + px.x / uPx * .012) + .5 * sin(px.x / uPx * .09 - 1.3), cos(px.x / uPx * .04 - px.y / uPx * .016) + .5 * cos(px.y / uPx * .08 + .7)) * .9 * uPx;
          vec2 o = off + (lens + wav) * smoothstep(0., .6, t);
          float disp = .012 + .035 * e;   // 色散只在边上一点点，像真玻璃那样淡
          vec2 uR = (px + o * (1. + disp)) / uRes, uG = (px + o) / uRes, uB = (px + o * (1. - disp)) / uRes;
          vec3 sharp = vec3(texture2D(tDiffuse, uR).r, texture2D(tDiffuse, uG).g, texture2D(tDiffuse, uB).b);
          vec3 soft = vec3(textureLod(tBlur, uR, .8).r, textureLod(tBlur, uG, .8).g, textureLod(tBlur, uB, .8).b);
          float body = smoothstep(.05, .75, t);
          vec3 col = mix(sharp, soft, body * .62);   /* 只是一层很轻的磨砂，颜色都是背后自己的 */
          /* 斜面上的光：朝光那一侧亮、背光那一侧暗；沿着周长强弱在变 */
          float face = dot(g, uL), lip = smoothstep(.55, .95, e);
          col += vec3(1., .99, .97) * lip * pow(max(face, 0.), 1.5) * (.42 - .22 * uNight);
          col += vec3(1.) * smoothstep(.86, 1., e) * .14 * (1. - .5 * uNight);        /* 一根发丝那么细的亮边 */
          col *= 1. - lip * max(-face, 0.) * .14;
          float a = clamp(-d / (1.1 * uPx), 0., 1.) * uOn;                   /* 边缘抗锯齿 */
          gl_FragColor = vec4(mix(base.rgb, col, a), 1.);
        }`}));
  }
  setSize(w, h){ this.blurRT.setSize(Math.max(4, Math.round(w / 4)), Math.max(4, Math.round(h / 4))); this.uniforms.uRes.value.set(w, h); }
  dispose(){this.blurRT.dispose();this.copy.material.dispose();this.copy.dispose();this.quad.material.dispose();this.quad.dispose();}
  render(renderer, writeBuffer, readBuffer){
    this.copy.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.blurRT); this.copy.render(renderer);

    this.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
}

export function syncGlass(pass, host, elements, night=1){
 const bounds=host.getBoundingClientRect(),U=pass.uniforms;
 const scale=U.uRes.value.x/Math.max(1,bounds.width);
 let n=0;
 for(const el of elements){
  if(n>=GLASS_N||el.hidden)continue;
  const r=el.getBoundingClientRect(),s=getComputedStyle(el);
  if(r.width<1||r.height<1||s.visibility==='hidden'||s.display==='none'||Number(s.opacity)<.02)continue;
  let opacity=Number(s.opacity);for(let p=el.parentElement;p;p=p.parentElement){const ps=getComputedStyle(p);if(ps.visibility==='hidden'||ps.display==='none'){opacity=0;break;}opacity*=Number(ps.opacity);}
  if(opacity<.02||r.bottom<bounds.top||r.top>bounds.bottom)continue;
  U.uRects.value[n].set((r.left-bounds.left)*scale,(bounds.bottom-r.bottom)*scale,r.width*scale,r.height*scale);
  U.uRads.value[n]=Math.min(parseFloat(s.borderTopLeftRadius)||14,r.height/2)*scale;
  U.uAs.value[n]=opacity;U.uShs.value[n]=.6;n++;
 }
 U.uN.value=n;U.uPx.value=scale;U.uNight.value=night;
}

