/**
 * Shader de pantalla completa: atmósfera (dispersión Rayleigh + Mie + ozono, sombra de la Tierra),
 * paisaje de atardecer a ras de suelo, nubes bajas, Tierra desde órbita (textura Blue Marble de la NASA),
 * campo estelar procedural con temperatura de color, Vía Láctea y estrellas brillantes con difracción.
 * Unidades: kilómetros; origen en el centro de la Tierra.
 */
export const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec3 uCamPos, uF, uR, uU;
uniform vec2 uTan;
uniform vec3 uSun;
uniform float uDbg, uAlt;
uniform float uSunI, uTime, uExposure, uTerrain, uCloud, uTwinkle, uMW, uStarGain, uAmb;
uniform vec3 uNorth0, uEast0;
uniform vec3 uGalN, uGalC;
uniform sampler2D uEarth;
uniform vec4 uB[NB];
uniform float uFog, uStreak, uHeat, uFlash, uWorlds;
uniform vec2 uVP;      // punto de fuga del movimiento (NDC con aspecto)
uniform vec4 uMoonD;   // dirección de la Luna + radio angular (rad)
uniform vec3 uMarsD;   // dirección de Marte
uniform vec3 uBC[NB];

#define PI 3.14159265
#define R0 6371.0
#define RA 6471.0
const vec3 kR = vec3(5.802e-3, 13.558e-3, 33.1e-3);
const float kM = 3.996e-3;
const float kMe = 4.44e-3;
const vec3 kO = vec3(3.0e-3, 2.6e-3, 0.12e-3);

vec2 rsi(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float d = b * b - c;
  if (d < 0.0) return vec2(1e9, -1e9);
  d = sqrt(d);
  return vec2(-b - d, -b + d);
}
/** intersección precisa desde la cámara (evita la cancelación numérica a ras de suelo) */
vec2 rsiCam(vec3 up, float alt, vec3 rd, float r) {
  float b = (R0 + alt) * dot(up, rd);
  float c = (alt + R0 - r) * (alt + R0 + r);
  float d = b * b - c;
  if (d < 0.0) return vec2(1e9, -1e9);
  d = sqrt(d);
  return vec2(-b - d, -b + d);
}
vec3 dens(float h) { return vec3(exp(-h / 8.0), exp(-h / 1.2), max(0.0, 1.0 - abs(h - 25.0) / 15.0)); }

vec3 atmosphere(vec3 ro, vec3 rd, float tMax, out vec3 trans) {
  trans = vec3(1.0);
  vec2 a = rsiCam(normalize(ro), uAlt, rd, RA);
  float t0 = max(a.x, 0.0), t1 = min(a.y, tMax);
  if (t1 <= t0) return vec3(0.0);
  float L = t1 - t0;
  float mu = dot(rd, uSun);
  float phR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.76, gg = g * g;
  float phM = 3.0 / (8.0 * PI) * ((1.0 - gg) * (1.0 + mu * mu)) / ((2.0 + gg) * pow(1.0 + gg - 2.0 * g * mu, 1.5));
  vec3 sR = vec3(0.0), sM = vec3(0.0), od = vec3(0.0);
  float prev = 0.0;
  for (int i = 0; i < PSTEPS; i++) {
    float f = (float(i) + 1.0) / float(PSTEPS);
    float tt = L * f * f;
    float ds = tt - prev;
    vec3 p = ro + rd * (t0 + prev + ds * 0.5);
    prev = tt;
    float h = length(p) - R0;
    vec3 d = dens(h) * ds;
    od += d;
    vec2 sh = rsi(p, uSun, R0 - 2.0);
    if (sh.x > 0.0 && sh.x < 1e8) continue;
    float lL = rsi(p, uSun, RA).y;
    float lds = lL / float(LSTEPS);
    vec3 lod = vec3(0.0);
    for (int j = 0; j < LSTEPS; j++) {
      vec3 q = p + uSun * ((float(j) + 0.5) * lds);
      lod += dens(length(q) - R0) * lds;
    }
    vec3 tau = kR * (od.x + lod.x) + kMe * (od.y + lod.y) + kO * (od.z + lod.z);
    vec3 att = exp(-tau);
    sR += d.x * att;
    sM += d.y * att;
  }
  trans = exp(-(kR * od.x + kMe * od.y + kO * od.z));
  // dispersión múltiple aproximada (luz del cielo crepuscular)
  vec3 amb = vec3(0.00022, 0.00055, 0.0014) * (1.0 - trans) * uAmb;
  return uSunI * (sR * kR * phR + sM * kM * phM) + amb;
}

float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float n2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h33(i).x, b = h33(i + vec3(1, 0, 0)).x, c = h33(i + vec3(0, 1, 0)).x, d = h33(i + vec3(1, 1, 0)).x;
  float e = h33(i + vec3(0, 0, 1)).x, f1 = h33(i + vec3(1, 0, 1)).x, g = h33(i + vec3(0, 1, 1)).x, h = h33(i + vec3(1, 1, 1)).x;
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, f1, f.x), mix(g, h, f.x), f.y), f.z);
}
float fbm2(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++) { s += a * n3(p); p = p * 2.02 + 11.7; a *= 0.5; } return s; }

/** color aproximado de un cuerpo negro (temperatura en K) */
vec3 bb(float t) {
  t = clamp(t, 2500.0, 14000.0) / 100.0;
  float r = t <= 66.0 ? 1.0 : clamp(1.2929 * pow(t - 60.0, -0.1332), 0.0, 1.0);
  float g = t <= 66.0 ? clamp(0.3901 * log(t) - 0.6318, 0.0, 1.0) : clamp(1.1298 * pow(t - 60.0, -0.0755), 0.0, 1.0);
  float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.5432 * log(t - 10.0) - 1.1963, 0.0, 1.0));
  return pow(vec3(r, g, b), vec3(2.2));
}

vec3 starLayer(vec3 rd, mat3 m, float S, float prob, float bright, float seed, float pxA) {
  vec3 q = m * rd;
  vec3 c = floor(q * S);
  vec3 h = h33(c + seed);
  if (h.x > prob) return vec3(0.0);
  vec3 j = h33(c + seed + 7.31);
  vec3 sd = normalize(c + 0.22 + 0.56 * j);
  vec3 fc = sd * S - c;
  if (any(lessThan(fc, vec3(0.12))) || any(greaterThan(fc, vec3(0.88)))) return vec3(0.0);
  float ang = length(q - sd);
  float sig = pxA * 0.7;
  float b = bright * (0.005 + 0.9 * pow(h.y, 9.0));
  float tw = 1.0 + uTwinkle * 0.8 * sin(uTime * (9.0 + 14.0 * h.z) + h.y * 60.0);
  float temp = mix(3000.0, 11000.0, pow(h.z, 1.4));
  return bb(temp) * b * tw * exp(-ang * ang / (2.0 * sig * sig));
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  // aire caliente del motor: ondulación leve en la parte baja del encuadre
  if (uHeat > 0.001) {
    float hw = uHeat * smoothstep(0.4, -1.0, ndc.y);
    ndc += hw * 0.006 * vec2(sin(ndc.y * 38.0 + uTime * 31.0), cos(ndc.x * 29.0 + uTime * 27.0));
  }
  vec3 rd = normalize(uF + ndc.x * uTan.x * uR + ndc.y * uTan.y * uU);
  vec3 ro = uCamPos;
  vec3 up = normalize(ro);
  float alt = uAlt;
  float pxA = 2.0 * uTan.y / uRes.y;

  vec2 pl = rsiCam(up, alt, rd, R0);
  bool hit = pl.x > 0.0 && pl.y > pl.x;
  vec3 T;
  vec3 col = atmosphere(ro, rd, hit ? pl.x : 1e9, T);

  if (hit) {
    vec3 p = ro + rd * pl.x;
    vec3 n = p / R0;
    float lat = asin(clamp(n.y, -1.0, 1.0));
    float lon = atan(-n.z, n.x);
    vec3 tex = texture2D(uEarth, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI)).rgb;
    vec3 alb = pow(tex, vec3(2.2)) * 0.9;
    float land = smoothstep(0.13, 0.24, tex.r + tex.g);
    float mu = dot(n, uSun);
    float cl = smoothstep(0.52, 0.78, fbm3(n * 7.0 + vec3(0.0, 0.0, uTime * 0.0004)));
    cl *= 0.55 + 0.45 * smoothstep(0.3, 0.7, fbm3(n * 2.5 + 3.0));
    alb = mix(alb, vec3(0.75), cl * 0.9);
    vec3 sunT = exp(-(kR * 8.0 + kMe * 1.2 + kO * 8.0) / max(mu + 0.04, 0.02));
    vec3 lit = alb * uSunI * max(mu, 0.0) / PI * sunT;
    // destello del sol en el océano
    vec3 hv = normalize(uSun - rd);
    lit += (1.0 - land) * (1.0 - cl) * pow(max(dot(n, hv), 0.0), 220.0) * uSunI * 0.25 * sunT * step(0.0, mu);
    // luces nocturnas (procedurales, sólo tierra firme)
    float night = smoothstep(0.02, -0.12, mu);
    float city = pow(n3(n * 260.0), 10.0) * 6.0 + pow(n3(n * 70.0), 6.0) * 0.6;
    lit += night * land * (1.0 - cl) * city * vec3(1.0, 0.62, 0.3) * 0.0016;
    col += lit * T;
  } else {
    // cielo: estrellas, Vía Láctea y estrellas brillantes
    vec3 s = vec3(0.0);
    s += starLayer(rd, mat3(1.0), 64.0, 0.26, 1.0, 1.0, pxA);
    s += starLayer(rd, mat3(0.36, 0.48, -0.8, -0.8, 0.6, 0.0, 0.48, 0.64, 0.6), 71.0, 0.3, 0.55, 13.0, pxA);
#if STARL > 2
    s += starLayer(rd, mat3(0.0, 0.6, 0.8, 1.0, 0.0, 0.0, 0.0, 0.8, -0.6), 83.0, 0.26, 0.35, 29.0, pxA);
#endif
    for (int i = 0; i < NB; i++) {
      vec3 d = uB[i].xyz;
      if (dot(rd, d) < 0.996) continue;
      vec3 dd = d - rd;
      float dx = dot(dd, uR) / pxA, dy = dot(dd, uU) / pxA;
      float r2 = dx * dx + dy * dy;
      float m = uB[i].w;
      float core = exp(-r2 / 1.4);
      float halo = 0.05 / (1.0 + r2 * 0.12);
      float spk = (exp(-abs(dy) * 1.3 - abs(dx) * 0.11) + exp(-abs(dx) * 1.3 - abs(dy) * 0.11)) * 0.06 * m;
      float tw = 1.0 + uTwinkle * 0.6 * sin(uTime * (11.0 + float(i)) + float(i) * 3.7);
      s += uBC[i] * m * (core + halo + spk) * tw;
    }
    // Marte: un punto brillante rojizo (como se ve a simple vista), con halo suave
    if (uWorlds > 0.001) {
      vec3 dm = uMarsD - rd;
      float mx = dot(dm, uR) / pxA, my = dot(dm, uU) / pxA;
      float mr2 = mx * mx + my * my;
      s += vec3(1.0, 0.42, 0.18) * uWorlds * (2.4 * exp(-mr2 / 2.2) + 0.09 / (1.0 + mr2 * 0.05) + (exp(-abs(my) * 1.1 - abs(mx) * 0.12) + exp(-abs(mx) * 1.1 - abs(my) * 0.12)) * 0.05);
    }
    // Vía Láctea
    float b = dot(rd, uGalN);
    float band = exp(-b * b / (2.0 * 0.13 * 0.13));
    if (band > 0.0008) {
      float gc = acos(clamp(dot(rd, uGalC), -1.0, 1.0));
      float core = exp(-gc * gc / 0.45);
      float n1 = fbm3(rd * 5.0);
      float dust = smoothstep(0.42, 0.72, fbm3(rd * 11.0 + 3.0)) * exp(-b * b / (2.0 * 0.05 * 0.05));
      float grain = pow(n3(rd * 420.0), 6.0);
      float mw = band * (0.25 + 0.75 * n1) * (1.0 + 2.6 * core) * (1.0 - 0.8 * dust);
      vec3 mwc = mix(vec3(0.62, 0.68, 0.95), vec3(1.0, 0.84, 0.66), core);
      s += mwc * (mw * 0.016 + band * grain * 0.06) * uMW * smoothstep(0.0008, 0.03, band);
    }
    // la Luna: disco con fase según la dirección del Sol, mares y cráteres procedurales
    if (uWorlds > 0.001) {
      float ca = dot(rd, uMoonD.xyz);
      float ang = acos(clamp(ca, -1.0, 1.0));
      float rr = ang / uMoonD.w;
      if (rr < 1.6) {
        vec3 mR = normalize(cross(uMoonD.xyz, uU));
        vec3 mU = cross(mR, uMoonD.xyz);
        vec3 off = rd - uMoonD.xyz * ca;
        vec2 dq = vec2(dot(off, mR), dot(off, mU)) / sin(uMoonD.w);
        float l2 = dot(dq, dq);
        float edge = 1.0 - smoothstep(1.0 - pxA / uMoonD.w * 1.5, 1.0, sqrt(l2));
        vec3 nrm = normalize(mR * dq.x + mU * dq.y - uMoonD.xyz * sqrt(max(0.0, 1.0 - l2)));
        vec3 sunL = normalize(uSun * 0.6 + mR * 0.8 + mU * 0.25);
        float lam = max(dot(nrm, sunL), 0.0);
        float mare = smoothstep(0.58, 0.42, fbm2(dq * 2.2 + 3.0));
        float tex = 0.62 + 0.38 * fbm2(dq * 9.0 + 11.0);
        vec3 alb = vec3(0.92, 0.9, 0.86) * tex * (1.0 - 0.38 * mare);
        vec3 moon = alb * (lam * 1.5 + 0.035); // + luz cenicienta
        col = mix(col, moon * uWorlds * T, edge);
        s *= 1.0 - edge;
        s += vec3(0.75, 0.8, 0.9) * 0.05 * uWorlds * exp(-max(rr - 1.0, 0.0) * 4.0) * (1.0 - edge);
      }
    }
    // disco solar (si entra en cuadro)
    float sd = dot(rd, uSun);
    col += vec3(1.0, 0.95, 0.88) * step(0.99997, sd) * uSunI * 4.0 * T;
    col += s * T * uStarGain;
  }

  // ---- a ras de suelo: nubes bajas y siluetas de montaña ----
  if (uCloud > 0.001 || uTerrain > 0.001) {
    vec3 east = normalize(uEast0 - up * dot(uEast0, up));
    vec3 north = normalize(cross(up, east));
    float sinE = dot(rd, up);
    float e = asin(clamp(sinE, -1.0, 1.0));
    float az = atan(dot(rd, east), dot(rd, north));
    vec3 sunH = normalize(uSun - up * dot(uSun, up));
    vec3 rdH = normalize(rd - up * sinE + 1e-5);
    float facing = dot(rdH, sunH);
    if (uCloud > 0.001 && sinE > 0.015) {
      float t = (5.0 - alt) / sinE;
      vec2 pc = vec2(dot(rd, east), dot(rd, north)) * t;
      float d = smoothstep(0.5, 0.82, fbm2(pc / 11.0 + vec2(uTime * 0.01, 0.0)));
      d *= exp(-t / 160.0) * uCloud;
            vec3 cc = col * 0.3 + vec3(1.0, 0.45, 0.28) * pow(max(facing, 0.0), 4.0) * 0.012 * (1.0 - smoothstep(0.0, 0.45, e)) + vec3(0.00015, 0.0002, 0.00035);
      col = mix(col, cc, d * 0.85);
    }
    if (uTerrain > 0.001) {
      vec2 ac = vec2(cos(az), sin(az));
      float sink = (1.0 - uTerrain) * 0.25;
      float rg = 1.0 - abs(2.0 * fbm2(ac * 4.0 + 4.0) - 1.0);
      float hf = 0.025 + 0.1 * pow(fbm2(ac * 2.2 + 1.0), 1.6) + 0.035 * rg * rg - sink;
      float hm = 0.012 + 0.06 * pow(fbm2(ac * 5.0 + 9.0), 1.4) - sink;
      float hn = -0.01 + 0.05 * fbm2(ac * 11.0 + 21.0) - sink;
      float aa = pxA * 1.2;
      vec3 haze = col;
      float mf = 1.0 - smoothstep(hf - aa, hf + aa, e);
      col = mix(col, haze * 0.42 + vec3(0.00004, 0.00005, 0.0001), mf);
      float mm = 1.0 - smoothstep(hm - aa, hm + aa, e);
      vec3 midc = haze * 0.16 + vec3(0.00002, 0.00003, 0.00005);
      // luces de un pueblo lejano al pie de la ladera
      vec2 lc = floor(vec2(az, e) * 520.0);
      vec2 lf = fract(vec2(az, e) * 520.0) - 0.5;
      float lamp = step(0.988, h21(lc)) * step(e, hm - 0.003) * step(hm - 0.03, e) * exp(-dot(lf, lf) * 14.0);
      midc += lamp * vec3(1.0, 0.62, 0.32) * 0.006 * (0.4 + h21(lc + 5.0));
      col = mix(col, midc, mm);
      float mn = 1.0 - smoothstep(hn - aa, hn + aa, e);
      vec3 nearc = vec3(0.00001, 0.000012, 0.00002) + vec3(0.0011, 0.0007, 0.0006) * exp(-max(-e, 0.0) * 18.0) * (0.5 + 0.5 * max(facing, 0.0)) * smoothstep(-0.002, 0.004, hn - e);
      col = mix(col, nearc, mn);
    }
  }

  if (uDbg > 0.5) {
    vec3 T2; vec3 a2 = atmosphere(ro, rd, hit ? pl.x : 1e9, T2);
    if (uDbg < 1.5) col = a2; else if (uDbg < 2.5) col = vec3(T2) * 0.02; else col = vec3(hit ? 0.02 : 0.0);
  }
  // exposición y tono
  col = 1.0 - exp(-col * uExposure);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 q = vec2(ndc.x * uRes.x / uRes.y, ndc.y);
  // estelas de velocidad: cristales de hielo y aire que pasan desde el punto de fuga
  if (uStreak > 0.001) {
    vec2 dv = q - uVP;
    float r = length(dv);
    float a = atan(dv.y, dv.x);
    float N = 260.0;
    float cell = floor(a / 6.2831853 * N);
    float hc = h11(cell * 1.37 + 3.0);
    // distancia al centro del carril en píxeles → estelas finas (~1 px) a cualquier distancia
    float lanePx = abs(fract(a / 6.2831853 * N) - 0.5) * (6.2831853 / N) * r * uRes.y * 0.5;
    float seg = fract(log(r + 0.05) * 1.1 - uTime * (1.6 + 1.8 * hc) + hc * 9.0);
    float on = step(0.86, hc) * exp(-lanePx * lanePx / 0.9) * smoothstep(0.0, 0.05, seg) * smoothstep(0.22, 0.06, seg);
    col += vec3(0.85, 0.92, 1.0) * on * uStreak * 0.22 * smoothstep(0.35, 1.1, r);
  }
  // nubes: la cámara las atraviesa (túnel de jirones iluminados por el atardecer)
  if (uFog > 0.001) {
    vec2 dv = q - uVP;
    float r = length(dv) + 0.02;
    vec2 dir = dv / r;
    float z = 0.55 / r + uTime * 2.6;
    float n = fbm2(dir * 2.4 + vec2(z * 0.7, z * 0.23));
    float n2b = fbm2(q * 3.0 + vec2(0.0, -uTime * 3.5));
    float dens = smoothstep(0.32, 0.72, n * 0.65 + n2b * 0.45) * uFog;
    dens = max(dens, uFog * uFog * 0.85);
    vec3 lit = mix(vec3(1.0, 0.8, 0.64), vec3(0.98, 0.94, 0.92), n2b);
    vec3 shade = mix(vec3(0.5, 0.5, 0.6), vec3(0.72, 0.68, 0.74), n2b);
    vec3 cc = mix(shade, lit, smoothstep(0.3, 0.85, n * 0.8 + n2b * 0.45 + 0.1 * q.x));
    col = mix(col, cc, clamp(dens, 0.0, 1.0));
  }
  // resplandor del motor bajo la cámara y destello de la ignición
  col += vec3(1.0, 0.56, 0.22) * uHeat * 0.32 * pow(smoothstep(-0.2, -1.15, ndc.y), 2.0);
  col += vec3(1.0, 0.85, 0.7) * uFlash * 0.35;
  col += (h21(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
