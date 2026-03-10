import { useEffect, useRef } from 'react';

// ── Vertex shader — full-screen quad ─────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ── Fragment shader — dungeon wall with torch + arcane lights ─────────────────
const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;

// ─── 2D Simplex Noise (Ashima Arts) ───────────────────────────────────────────
vec3 _perm(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = _perm(_perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz  + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ─── fBm — layered noise for stone texture ────────────────────────────────────
float fbm(vec2 p) {
  float val = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    val += amp * snoise(p);
    p    = p * 2.03 + vec2(3.17, 1.83);
    amp *= 0.5;
  }
  return val;
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 p   = vec2(uv.x * ar, uv.y);

  // ── Stone wall texture — very slowly drifting ──────────────────────────────
  float t  = u_time * 0.009;
  float macro  = fbm(p * 2.4 + vec2(t, t * 0.55));
  float micro  = fbm(p * 7.2 + vec2(t * 0.4, t * 0.9 + 2.1));
  float cracks = fbm(p * 14.0 + vec2(1.3, 0.7 + t * 0.2)) * 0.5 + 0.5;
  float wall   = macro * 0.55 + micro * 0.30 + (cracks - 0.5) * 0.15;

  // Base stone — very dark warm near-black
  vec3 col = vec3(0.046, 0.036, 0.030) + wall * vec3(0.038, 0.028, 0.022);

  // ── Torch 1 — bottom-left, erratic amber flicker ──────────────────────────
  float f1 = 0.80
    + 0.13 * snoise(vec2(u_time * 4.7,        0.0))
    + 0.07 * snoise(vec2(u_time * 13.1 + 3.0, 0.0));
  vec2  tp1 = vec2(0.14 * ar, 0.06);
  float d1  = length(p - tp1);
  float l1  = f1 * 0.24 / (d1 * d1 * 5.2 + 0.032);

  // ── Torch 2 — bottom-right, independent flicker ───────────────────────────
  float f2 = 0.83
    + 0.11 * snoise(vec2(u_time * 3.9 + 7.0,  1.0))
    + 0.06 * snoise(vec2(u_time * 10.3 + 5.0, 1.0));
  vec2  tp2 = vec2(0.86 * ar, 0.08);
  float d2  = length(p - tp2);
  float l2  = f2 * 0.19 / (d2 * d2 * 6.0 + 0.038);

  // ── Arcane glow — top-center, cool indigo, slow breath ───────────────────
  float breath = 0.40 + 0.60 * (0.5 + 0.5 * sin(u_time * 0.38));
  vec2  ap  = vec2(0.50 * ar, 0.90);
  float da  = length(p - ap);
  float la  = breath * 0.09 / (da * da * 3.8 + 0.075);

  // ── A subtle secondary arcane point — offset to break symmetry ───────────
  float breath2 = 0.30 + 0.70 * (0.5 + 0.5 * sin(u_time * 0.22 + 1.4));
  vec2  ap2 = vec2(0.62 * ar, 0.82);
  float da2 = length(p - ap2);
  float la2 = breath2 * 0.05 / (da2 * da2 * 5.0 + 0.09);

  // ── Apply lights ──────────────────────────────────────────────────────────
  col += vec3(0.90, 0.44, 0.05) * l1;          // warm amber
  col += vec3(0.86, 0.38, 0.04) * l2;          // warm amber (cooler)
  col += vec3(0.24, 0.14, 0.64) * la;          // arcane indigo
  col += vec3(0.18, 0.22, 0.58) * la2;         // arcane blue-violet

  // ── Vignette — heavier on sides than top/bottom ──────────────────────────
  vec2 vc  = uv - 0.5;
  float vd = dot(vc * vec2(1.1, 1.5), vc * vec2(1.1, 1.5));
  col *= clamp(1.0 - vd * 2.6, 0.0, 1.0) * 0.72 + 0.28;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[WebGLBackground] Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Graceful fallback — if WebGL not supported, the CSS background shows
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[WebGLBackground] Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad (2 triangles)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,   -1,  1,
      -1,  1,   1, -1,    1,  1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc  = gl.getUniformLocation(prog, 'u_res');
    const timeLoc = gl.getUniformLocation(prog, 'u_time');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width  = Math.floor(window.innerWidth  * dpr);
      canvas!.height = Math.floor(window.innerHeight * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(resLoc, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const startTime = performance.now();
    let rafId = 0;

    function render() {
      rafId = requestAnimationFrame(render);
      if (document.hidden) return;
      const t = (performance.now() - startTime) / 1000;
      gl!.uniform1f(timeLoc, t);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
