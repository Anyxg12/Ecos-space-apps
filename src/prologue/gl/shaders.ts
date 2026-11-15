/**
 * Shader del Horizonte. GLSL ES 1.00 → compila en WebGL1 y WebGL2.
 * Aproximación (no física exacta): se integran rayos de luz con la aceleración
 * a = -1.5·h²·r̂/r⁴ (ecuación de órbita de fotones en Schwarzschild, rs = 1),
 * se cruza con un disco fino en el plano y=0 y lo que escapa muestrea un cielo procedural.
 * Todos los parámetros narrativos (distancia, lente, estiramiento, fundido, paleta) son uniforms.
 */
export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export function fragmentShader(steps: number, stepScale: number, starLayers: number): string {
  return /* glsl */ `
precision highp float;
#define STEPS ${steps}
#define STEP_SCALE ${stepScale.toFixed(3)}
#define STAR_LAYERS ${starLayers}
varying vec2 vUv;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;   // -1..1 parallax suavizado
uniform vec2  uProbe;     // posición de la sonda (uv centrado, aspecto corregido)
uniform float uProbeK;    // intensidad de la micro-lente del cursor
uniform float uDist;      // distancia de la cámara (en radios de Schwarzschild)
uniform float uLens;      // multiplicador de la curvatura
uniform float uWarp;      // estiramiento de estrellas 0..1
uniform float uFade;      // 0 visible → 1 negro
uniform float uExposure;
uniform float uElev;      // elevación de cámara (rad)
uniform float uRoll;
uniform vec3  uDiskHot;
uniform vec3  uDiskWarm;
uniform vec3  uDiskCool;
uniform vec3  uNebula;
uniform float uPosterize;
uniform float uMono;
uniform float uDiskSpeed;
uniform float uShiftY;   // desplaza el agujero en pantalla (composición)
uniform float uZoom;     // corrección de encuadre por aspecto (móvil vertical)

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1,0,0));
  float n010 = hash13(i + vec3(0,1,0));
  float n110 = hash13(i + vec3(1,1,0));
  float n001 = hash13(i + vec3(0,0,1));
  float n101 = hash13(i + vec3(1,0,1));
  float n011 = hash13(i + vec3(0,1,1));
  float n111 = hash13(i + vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise3(p); p = p * 2.03 + 1.7; a *= 0.5; }
  return s;
}

vec3 starLayer(vec3 d, float scale, float size, float density) {
  vec3 p = d * scale;
  vec3 c = floor(p);
  vec3 f = fract(p);
  float h = hash13(c);
  if (h < 1.0 - density) return vec3(0.0);
  vec3 o = vec3(hash13(c + 11.3), hash13(c + 27.1), hash13(c + 41.7)) * 0.6 + 0.2;
  float dist = length(f - o);
  float b = smoothstep(size, 0.0, dist);
  b = b * b;
  float tw = 0.85 + 0.15 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
  float temp = hash13(c + 7.7);
  vec3 tint = mix(vec3(1.0, 0.78, 0.6), vec3(0.7, 0.82, 1.0), temp);
  return tint * b * tw * (0.4 + 2.4 * pow(fract(h * 13.7), 6.0));
}

vec3 sky(vec3 d) {
  vec3 col = vec3(0.0);
  col += starLayer(d, 90.0, 0.16, 0.30) * 1.6;
  col += starLayer(d, 210.0, 0.22, 0.35);
#if STAR_LAYERS > 2
  col += starLayer(d, 420.0, 0.26, 0.40) * 0.55;
#endif
  // banda galáctica y nebulosa muy sutil
  vec3 bandN = normalize(vec3(0.25, 1.0, 0.35));
  float band = exp(-pow(dot(d, bandN), 2.0) * 9.0);
  float n = fbm(d * 3.2 + vec3(0.0, 0.0, uTime * 0.004));
  float n2 = fbm(d * 7.0 - 3.0);
  col += uNebula * band * (0.25 + 0.9 * n * n) * 0.55;
  col += vec3(0.9, 0.75, 0.6) * band * pow(n2, 3.0) * 0.12;
  col += uNebula * 0.05 * n;
  return col;
}

vec3 skyWarped(vec3 d, vec3 fwd) {
  if (uWarp < 0.002) return sky(d);
  // estiramiento radial controlado (efecto «hiperespacio» suave, sin destellos)
  vec3 radial = normalize(d - fwd * dot(d, fwd) + 1e-5);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float k = float(i) / 5.0;
    acc += sky(normalize(d - radial * k * uWarp * 0.06));
  }
  return acc / 6.0 * (1.0 + uWarp * 0.6);
}

vec3 diskColor(vec3 hp, vec3 rayDir, out float alpha) {
  float hr = length(hp.xz);
  const float RIN = 2.6;
  const float ROUT = 10.5;
  alpha = 0.0;
  if (hr < RIN || hr > ROUT) return vec3(0.0);
  float x = (hr - RIN) / (ROUT - RIN);
  float rot = uTime * uDiskSpeed * 1.8 / pow(hr, 1.5);
  float phi = atan(hp.z, hp.x) - rot;
  vec3 q = vec3(cos(phi) * 2.6, sin(phi) * 2.6, hr * 3.2);
  float n = fbm(q);
  float n2 = noise3(vec3(cos(phi) * 9.0, sin(phi) * 9.0, hr * 11.0));
  float dens = smoothstep(RIN, RIN + 0.35, hr) * (1.0 - smoothstep(ROUT - 5.0, ROUT, hr));
  dens *= 0.12 + 1.25 * smoothstep(0.2, 0.8, n) + 0.3 * n2;
  float t = pow(1.0 - x, 1.6);
  vec3 c = mix(uDiskCool, uDiskWarm, smoothstep(0.0, 0.45, t));
  c = mix(c, uDiskHot, smoothstep(0.5, 1.0, t));
  float inten = 0.14 + 1.25 * t;
  // Doppler relativista aproximado: el lado que se acerca brilla más
  vec3 vdir = normalize(vec3(-hp.z, 0.0, hp.x));
  float beta = clamp(sqrt(0.5 / hr), 0.0, 0.6);
  float cosT = dot(vdir, -rayDir);
  float g = sqrt(1.0 - beta * beta) / (1.0 - beta * cosT);
  float boost = clamp(mix(1.0, g * g * g, 0.72), 0.15, 2.4);
  // corrimiento al rojo gravitacional (atenúa el borde interno)
  float grav = sqrt(clamp(1.0 - 1.0 / hr, 0.0, 1.0));
  c = mix(c, c * vec3(0.8, 0.95, 1.25), clamp(g - 1.0, 0.0, 1.0) * 0.6);
  alpha = clamp(dens * 0.95, 0.0, 0.97);
  return c * inten * boost * grav;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (vUv * uRes - 0.5 * uRes) / uRes.y;
  uv.y -= uShiftY;
  // micro-lente gravitacional que sigue al cursor (sonda): deflexión θE²/θ
  vec2 dv = uv - uProbe;
  float d2 = dot(dv, dv) + 1e-4;
  uv -= dv * (uProbeK * 0.0011 / d2) * smoothstep(0.0, 0.004, d2);

  float cr = cos(uRoll), sr = sin(uRoll);
  uv = mat2(cr, -sr, sr, cr) * uv;

  float yaw = 0.35 + uPointer.x * 0.06 + sin(uTime * 0.05) * 0.03;
  float el = uElev + uPointer.y * 0.035 + sin(uTime * 0.07) * 0.01;
  vec3 camPos = uDist * vec3(sin(yaw) * cos(el), sin(el), cos(yaw) * cos(el));
  vec3 fwd = normalize(-camPos);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  float focal = (1.3 + clamp(34.0 - uDist, 0.0, 40.0) * 0.012) * uZoom;
  vec3 rd = normalize(fwd * focal + uv.x * right + uv.y * up);

  vec3 pos = camPos;
  vec3 vel = rd;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  vec3 col = vec3(0.0);
  float T = 1.0;
  float glow = 0.0;
  bool captured = false;

  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < 1.0) { captured = true; break; }
    if (r > uDist + 8.0 && dot(pos, vel) > 0.0) break;
    float dt = clamp(STEP_SCALE * r, 0.02, 2.5);
    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r) * uLens;
    vec3 prev = pos;
    vel += acc * dt;
    pos += vel * dt;
    // halo volumétrico tenue alrededor del disco
    float lxz = length(pos.xz);
    glow += T * dt * exp(-abs(pos.y) * 4.0) * smoothstep(11.5, 3.0, lxz) * smoothstep(2.0, 3.2, lxz) * 0.011;
    if (prev.y * pos.y < 0.0) {
      float t = prev.y / (prev.y - pos.y);
      vec3 hp = mix(prev, pos, t);
      float a;
      vec3 dc = diskColor(hp, normalize(vel), a);
      col += T * dc * a;
      T *= 1.0 - a;
      if (T < 0.02) break;
    }
  }
  if (!captured && T > 0.02) col += T * skyWarped(normalize(vel), fwd);
  col += glow * uDiskWarm * 1.3;

  col *= uExposure;
  // look por identidad
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 monoCol = vec3(lum) * vec3(1.05, 0.98, 0.88);
  col = mix(col, monoCol, uMono);
  vec3 tm = aces(col);
  if (uPosterize > 0.001) {
    float levels = 5.0;
    vec3 sat = mix(vec3(dot(tm, vec3(0.333))), tm, 1.35);
    vec3 post = floor(clamp(sat, 0.0, 1.0) * levels + 0.5) / levels;
    tm = mix(tm, post, uPosterize * 0.85);
  }
  tm = pow(tm, vec3(1.0 / 2.2));

  vec2 sv = vUv - 0.5;
  float vig = smoothstep(1.05, 0.25, length(sv * vec2(uRes.x / uRes.y, 1.0) * 0.9));
  tm *= mix(0.55, 1.0, vig);
  float grain = (hash13(vec3(gl_FragCoord.xy, floor(uTime * 24.0))) - 0.5) * 0.025;
  tm += grain;
  tm *= 1.0 - uFade;
  gl_FragColor = vec4(max(tm, 0.0), 1.0);
}
`;
}
