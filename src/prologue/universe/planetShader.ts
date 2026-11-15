/**
 * Shader de los universos Explorer (estilo holográfico/videojuego) y Discovery (realista/épico).
 * GLSL ES 1.00. Todo procedural: sin texturas.
 * Los planetas se dibujan en espacio de pantalla en la posición de sus botones DOM (uniforms uP0..uP2),
 * así la zona clicable y el dibujo coinciden siempre.
 *   0 = Luna · 1 = Marte (los dos mundos del reto: equipo de la NASA en la Luna y en Marte)
 */
export const PLANET_VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export function planetFrag(highQuality: boolean) {
  return /* glsl */ `
precision highp float;
#define HQ ${highQuality ? 1 : 0}
uniform vec2 uRes;
uniform float uTime;
uniform float uStyle;    // 0 realista · 1 holográfico
uniform vec3 uP0;        // (x, y, radio) en píxeles del canvas, origen abajo-izquierda
uniform vec3 uP1;
uniform vec3 uP2;
uniform vec3 uHover;     // 0..1 por destino
uniform float uZoom;
uniform vec2 uZoomT;     // punto fuente que se acerca
uniform vec2 uZoomS;     // dónde aparece en pantalla
uniform float uDim;
uniform float uFocus;    // destino en el que se entra (-1 ninguno)

float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.02 + 3.1; a *= 0.5; } return s; }
float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * noise3(p); p = p * 2.02 + 3.1; a *= 0.5; } return s; }

// cráteres: celdas 3D sobre la esfera → cuenco + borde
float craters(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); float res = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    float h = hash13(i + g);
    if (h < 0.45) continue;
    vec3 o = vec3(hash13(i + g + 7.1), hash13(i + g + 3.7), hash13(i + g + 1.9));
    float r = 0.18 + 0.28 * hash13(i + g + 5.3);
    float d = length(g + o - f) / r;
    res -= (1.0 - smoothstep(0.0, 1.0, d)) * 0.28;
    res += smoothstep(1.3, 1.0, d) * smoothstep(0.75, 1.0, d) * 0.22;
  }
  return res;
}

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

vec3 background(vec2 p) {
  vec2 uv = p / uRes.y;
  vec3 col;
  if (uStyle < 0.5) {
    col = mix(vec3(0.004, 0.005, 0.012), vec3(0.02, 0.018, 0.03), uv.y);
    float n = fbm3(vec3(uv * 2.2, 1.7));
    col += vec3(0.10, 0.07, 0.05) * pow(n, 3.0) * 0.9 + vec3(0.03, 0.05, 0.10) * pow(fbm3(vec3(uv * 3.5, 9.0)), 3.0);
    // luz del Sol fuera de cuadro (izquierda)
    vec2 sun = vec2(-0.35 * uRes.x / uRes.y, 0.75);
    col += vec3(1.0, 0.82, 0.6) * 0.09 * exp(-length(uv - sun) * 2.6);
  } else {
    col = mix(vec3(0.002, 0.005, 0.018), vec3(0.012, 0.005, 0.03), uv.y);
    // suelo de rejilla en perspectiva (estética videojuego)
    float hz = 0.26;
    if (uv.y < hz) {
      float z = 1.0 / max(hz - uv.y, 0.002);
      float gx = abs(fract((uv.x - 0.5 * uRes.x / uRes.y) * z * 0.6) - 0.5);
      float gz = abs(fract(z * 0.35 + uTime * 0.25) - 0.5);
      float line = max(smoothstep(0.47, 0.5, gx), smoothstep(0.46, 0.5, gz));
      float fade = smoothstep(0.0, hz, uv.y) * 0.9 + 0.1;
      col += vec3(0.25, 0.9, 1.0) * line * 0.35 * (1.0 - fade * 0.7);
    }
    col += vec3(0.4, 0.2, 0.9) * 0.18 * exp(-abs(uv.y - hz) * 18.0);
  }
  // estrellas
  for (int l = 0; l < 3; l++) {
    float sc = 90.0 + float(l) * 110.0;
    vec2 g = uv * sc;
    vec2 c = floor(g);
    float h = hash12(c + float(l) * 17.0);
    if (h > 0.9) {
      vec2 o = vec2(hash12(c + 3.1), hash12(c + 7.7)) * 0.7 + 0.15;
      float d = length(fract(g) - o);
      float tw = 0.75 + 0.25 * sin(uTime * (1.0 + h * 4.0) + h * 30.0);
      float b = smoothstep(0.12 + 0.05 * (2.0 - float(l)), 0.0, d) * tw * (0.3 + 0.7 * pow(fract(h * 37.0), 4.0));
      col += mix(vec3(1.0, 0.85, 0.7), vec3(0.7, 0.85, 1.0), fract(h * 91.0)) * b * (uStyle > 0.5 ? 0.8 : 1.0);
    }
  }
  return col;
}

// devuelve color premultiplicado (rgb) y cobertura (a)
vec4 sphere(int kind, vec2 p, vec3 P, float hover) {
  vec2 d = (p - P.xy) / P.z;
  float l = length(d);
  float aa = 1.2 / (P.z * uZoom);            // ~1 px de antialias, también durante el zoom
  vec3 L = normalize(vec3(-0.78, 0.38, 0.5));
  // halo atmosférico (empieza justo en el limbo, sin costura)
  float halo = 0.0;
  vec3 hc = vec3(0.0);
  float lo = max(l - 1.0, 0.0);
  if (uStyle < 0.5) {
    float lit = 0.25 + 0.75 * smoothstep(-0.7, 0.7, dot(d / max(l, 1e-4), normalize(L.xy)));
    if (kind == 1) { halo = exp(-lo * 30.0) * 0.5 * lit; hc = vec3(1.0, 0.55, 0.35); }
    else { halo = exp(-lo * 26.0) * 0.16 * lit; hc = vec3(0.82, 0.86, 1.0); }
    halo *= (0.75 + 0.35 * hover);
  } else {
    hc = kind == 0 ? vec3(0.3, 0.95, 1.0) : vec3(1.0, 0.4, 0.6);
    halo = exp(-lo * 14.0) * (0.3 + 0.5 * hover);
  }
  float edge = 1.0 - smoothstep(1.0 - aa, 1.0 + aa * 0.5, l);
  if (edge <= 0.0) return vec4(hc * halo, 0.0);
  float l2 = min(dot(d, d), 1.0);
  vec3 n = vec3(d, sqrt(max(0.0, 1.0 - l2)));
  float spin = uTime * (kind == 0 ? 0.012 : 0.02);
  vec3 q = rotY(spin + float(kind) * 1.7) * rotX(0.35) * n;

  vec3 albedo;
  float rough = 0.0;
  if (kind == 0) {
    float base = 0.52 + 0.28 * fbm(q * 3.0);
    float maria = smoothstep(0.56, 0.44, fbm3(q * 1.4 + 5.0));
    base *= 1.0 - 0.42 * maria;
    float cr = craters(q * 5.0);
#if HQ
    cr += 0.6 * craters(q * 13.0 + 2.0);
#endif
    base *= 1.0 + cr;
    albedo = vec3(base) * vec3(1.0, 0.98, 0.94);
    rough = cr;
  } else {
    float f = fbm(q * 2.4);
    vec3 rust = vec3(0.70, 0.31, 0.15);
    vec3 dark = vec3(0.34, 0.15, 0.08);
    vec3 dust = vec3(0.86, 0.56, 0.36);
    albedo = mix(dark, rust, smoothstep(0.32, 0.6, f));
    albedo = mix(albedo, dust, smoothstep(0.55, 0.8, fbm3(q * 5.0 + 11.0)) * 0.6);
    float cr = craters(q * 6.0) * 0.55;
    albedo *= 1.0 + cr;
    float cap = smoothstep(0.86, 0.93, abs(q.y) + 0.04 * noise3(q * 12.0));
    albedo = mix(albedo, vec3(0.95, 0.93, 0.9), cap);
    rough = cr;
  }

  vec3 col;
  float ndl = dot(n, L);
  if (uStyle < 0.5) {
    float diff = smoothstep(-0.08, 0.35, ndl) * max(ndl, 0.0) * 1.35 + 0.02 * smoothstep(-0.2, 0.0, ndl);
    col = albedo * diff;
    // contraluz frío en el limbo (iluminación cinematográfica)
    float rim = pow(1.0 - n.z, 4.0);
    col += vec3(0.25, 0.35, 0.6) * rim * 0.08 * smoothstep(0.2, -0.4, ndl);
    if (kind == 1) col += vec3(1.0, 0.5, 0.3) * pow(1.0 - n.z, 3.0) * 0.45 * smoothstep(-0.2, 0.6, ndl);
    col *= 1.0 + 0.15 * hover;
  } else {
    vec3 neon = kind == 0 ? vec3(0.3, 0.95, 1.0) : vec3(1.0, 0.42, 0.62);
    float lum = dot(albedo, vec3(0.33));
    float lon = atan(q.x, q.z) / 6.2831853 * 18.0;
    float lat = asin(clamp(q.y, -1.0, 1.0)) / 3.14159 * 9.0;
    float grid = max(smoothstep(0.44, 0.5, abs(fract(lon) - 0.5)), smoothstep(0.44, 0.5, abs(fract(lat) - 0.5)));
    float fres = pow(1.0 - n.z, 2.2);
    float shade = smoothstep(-0.3, 0.6, ndl);
    col = neon * (lum * 0.42 * shade + fres * 0.95 + grid * 0.28 * (0.4 + shade)) ;
    col += vec3(0.6, 0.3, 1.0) * fres * 0.3;
    col *= 0.75 + 0.5 * hover;
    col *= 0.9 + 0.1 * sin(p.y * 1.6 + uTime * 4.0);
  }
  return vec4(col * edge + hc * halo * (1.0 - edge), edge);
}

void main() {
  vec2 p = uZoomT + (gl_FragCoord.xy - uZoomS) / uZoom;
  vec3 col = background(p);
  vec4 s0 = sphere(0, p, uP0, uHover.x);
  col = col * (1.0 - s0.a) + s0.rgb;
  vec4 s1 = sphere(1, p, uP1, uHover.y);
  col = col * (1.0 - s1.a) + s1.rgb;

  vec3 tm = aces(col * (uStyle < 0.5 ? 1.15 : 1.25));
  tm = pow(tm, vec3(1.0 / 2.2));
  vec2 sv = gl_FragCoord.xy / uRes - 0.5;
  tm *= mix(0.6, 1.0, smoothstep(0.95, 0.2, length(sv * vec2(uRes.x / uRes.y, 1.0))));
  if (uStyle > 0.5) tm *= 0.94 + 0.06 * step(0.5, fract(gl_FragCoord.y * 0.5));
  tm += (hash12(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.02;
  tm *= 1.0 - uDim;
  gl_FragColor = vec4(max(tm, 0.0), 1.0);
}
`;
}
