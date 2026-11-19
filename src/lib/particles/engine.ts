// -----------------------------------------------------------------------
// PARTICLE ENGINE
// Draws tens of thousands of points with WebGL2 and morphs them between
// shapes. Plain WebGL, no 3D library, so there's nothing extra to install.
//
// How a morph works: the GPU gets two position lists, "from" and "to", and a
// number t between 0 and 1. Each point moves from its "from" spot to its "to"
// spot, with a small random delay so they don't all leave at once, and gets
// thrown outward in the middle of the trip (the "dissipate" part). The cursor
// pushes points away as it moves over them.
//
// The page tells the engine where it is with setPosition(g): g = 2.4 means
// "40% of the way from keyframe 2 to keyframe 3".
// -----------------------------------------------------------------------

export type RGB = [number, number, number];

export type Keyframe = {
  shape: Float32Array;
  /** Where the shape sits and how big it is, in world units. */
  x: number;
  y: number;
  scale: number;
  /** 1 = keeps turning, 0 = only sways (used for words, so they stay readable). */
  spin: number;
  /** Tilt towards the viewer, in radians. */
  tilt: number;
  /** The resting angle a swaying shape turns around. */
  turn: number;
  /** 1 = holds still (no sway, no mouse tilt) and its points flow instead. */
  still: number;
  color: RGB;
  accent: RGB;
};

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec3 aFrom;
in vec3 aTo;
in vec4 aRand;

uniform float uT;
uniform float uScatter;
uniform float uTime;
uniform float uIntro;
uniform mat3 uRot;
uniform float uScale;
uniform vec3 uOffset;
uniform float uFocal;
uniform float uAspect;
uniform float uCamZ;
uniform vec2 uMouse;
uniform float uMouseAmt;
uniform float uSize;
uniform float uFlow;
uniform float uDust;

out float vTone;
out float vAccent;
out float vFade;

void main() {
  float d = aRand.w;
  // Each point starts its trip at a slightly different moment.
  float t = clamp((uT - d * 0.4) / 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aFrom, aTo, t);

  // Dissipate: thrown outward mid-trip, with a swirl.
  float s = sin(3.14159265 * t) * uScatter;
  p += aRand.xyz * s * 1.1;
  float a = s * 3.0 * (d - 0.5);
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;

  // A slow breath so the shape is never perfectly still.
  p += 0.011 * vec3(sin(uTime * 1.3 + aRand.x * 11.0), sin(uTime * 1.1 + aRand.y * 13.0), sin(uTime * 1.6 + aRand.z * 9.0));

  // A still shape keeps its points busy instead.
  float glow = 0.0;
  float flowFade = 1.0;
  if (uFlow > 0.0) {
    // A slow ripple rolls across the face, lifting points towards you.
    float wave = sin(p.x * 4.2 - uTime * 1.25 + p.y * 2.5);
    p.z += uFlow * wave * 0.06;
    glow = uFlow * wave;
    // Every point shimmers in its own tiny circle.
    float ph = uTime * (0.7 + d * 1.1) + aRand.x * 30.0;
    p.xy += uFlow * 0.007 * vec2(cos(ph), sin(ph));
    // A few (uDust) drift up off the letters like dust, fade, and start again.
    float sel = step(1.0 - uDust, fract(d * 53.7));
    float life = fract(uTime * (0.06 + 0.04 * aRand.y) + d * 7.31);
    p += uFlow * sel * vec3(aRand.x * 0.03, life * 0.12, aRand.z * 0.05);
    flowFade = 1.0 - uFlow * sel * (smoothstep(0.3, 1.0, life) + 1.0 - smoothstep(0.0, 0.06, life));
  }

  // Intro: points rush in from far away.
  float it = clamp((uIntro - d * 0.55) / 0.45, 0.0, 1.0);
  it = 1.0 - pow(1.0 - it, 3.0);
  p = mix(normalize(aRand.xyz + 0.001) * (3.0 + d * 4.0), p, it);

  vec3 w = uRot * p * uScale + uOffset;
  float depth = uCamZ - w.z;
  // Points that fly too close to (or behind) the camera are skipped.
  if (depth < 1.2) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vTone = 0.0; vAccent = 0.0; vFade = 0.0;
    return;
  }
  vec2 ndc = vec2(w.x * uFocal / uAspect, w.y * uFocal) / depth;

  // The cursor pushes nearby points away.
  vec2 dm = ndc - uMouse;
  dm.x *= uAspect;
  float L = length(dm);
  float f = (1.0 - smoothstep(0.0, 0.32, L)) * uMouseAmt;
  vec2 push = normalize(dm + vec2(0.0001)) * f * (0.06 + 0.16 * d);
  push.x /= uAspect;
  ndc += push;

  gl_Position = vec4(ndc, 0.0, 1.0);
  float size = uSize * (uCamZ / depth) * (0.55 + d * 0.95);
  gl_PointSize = clamp(floor(size + 0.5), 1.0, uSize * 2.2);

  vTone = clamp(0.55 + w.z * 0.35 / max(uScale, 0.001) + glow * 0.3, 0.0, 1.0);
  vAccent = step(0.955, fract(d * 37.13));
  vFade = (1.0 - f * 0.55) * it * clamp(flowFade, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform vec3 uAccent;
in float vTone;
in float vAccent;
in float vFade;
out vec4 outColor;
void main() {
  vec3 c = mix(uColor * 0.78, uColor, vTone);
  c = mix(c, uAccent, vAccent);
  float alpha = mix(0.42, 1.0, vTone) * vFade;
  outColor = vec4(c * alpha, alpha);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader error");
  }
  return sh;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smooth = (t: number) => t * t * (3 - 2 * t);

export class ParticleEngine {
  readonly count: number;
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private fromBuf: WebGLBuffer;
  private toBuf: WebGLBuffer;
  private keyframes: Keyframe[] = [];
  private loaded = [-1, -1];
  private current = 0;
  private introStart = performance.now();
  private intro = 0;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, last: 0 };
  private tiltMouse = { x: 0, y: 0 };
  private raf = 0;
  private start = performance.now();
  private dpr = 1;
  private aspect = 1;
  private running = false;
  private maxDpr: number;
  private frameGap: number;
  private lastFrame = 0;
  private dust: number;
  private rot = new Float32Array(9);

  /** World units: the camera sits at z = CAM_Z with a 35° field of view. */
  static readonly CAM_Z = 5;
  static readonly FOCAL = 1 / Math.tan((35 * Math.PI) / 360);

  /**
   * `maxDpr` caps the canvas resolution and `fps` the frame rate: both are
   * lowered on phones and weak devices to save battery (see lib/film/quality.ts).
   * `dust` is the share of a still shape's points that drift off (0-1).
   */
  constructor(canvas: HTMLCanvasElement, count: number, { maxDpr = 2, fps = 60, dust = 0.08 } = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    this.canvas = canvas;
    this.count = count;
    this.maxDpr = maxDpr;
    // A little under the real gap, so 60 fps isn't knocked down to 30 by timer jitter.
    this.frameGap = 1000 / fps - 2;
    this.dust = dust;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
    gl.useProgram(prog);

    for (const name of ["uT", "uScatter", "uTime", "uIntro", "uRot", "uScale", "uOffset", "uFocal", "uAspect", "uCamZ", "uMouse", "uMouseAmt", "uSize", "uFlow", "uDust", "uColor", "uAccent"]) {
      this.uniforms[name] = gl.getUniformLocation(prog, name);
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const attr = (name: string, size: number, data: Float32Array, usage: number) => {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    };

    // Per-point random values: a direction to fly off in, and a 0-1 "personality".
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.cbrt(Math.random());
      const k = Math.sqrt(1 - u * u);
      rand.set([r * k * Math.cos(th), r * u, r * k * Math.sin(th), Math.random()], i * 4);
    }
    attr("aRand", 4, rand, gl.STATIC_DRAW);
    this.fromBuf = attr("aFrom", 3, new Float32Array(count * 3), gl.DYNAMIC_DRAW);
    this.toBuf = attr("aTo", 3, new Float32Array(count * 3), gl.DYNAMIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(this.uniforms.uFocal, ParticleEngine.FOCAL);
    gl.uniform1f(this.uniforms.uCamZ, ParticleEngine.CAM_Z);
    this.resize();
  }

  setKeyframes(frames: Keyframe[]) {
    const sameShapes =
      frames.length === this.keyframes.length && frames.every((f, i) => f.shape === this.keyframes[i].shape);
    this.keyframes = frames;
    if (!sameShapes) this.loaded = [-1, -1];
  }

  /** g = keyframe index plus progress to the next one. The page smooths it (Stage.tsx). */
  setPosition(g: number) {
    this.current = g;
  }

  /** Mouse in normalised coordinates, -1 to 1 with y up. */
  pointer(x: number, y: number) {
    this.mouse.tx = x;
    this.mouse.ty = y;
    this.mouse.last = performance.now();
  }

  playIntro(instant = false) {
    this.introStart = instant ? -Infinity : performance.now();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.aspect = w / h;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Half the visible height and width at z = 0, in world units. */
  viewHalf() {
    const h = ParticleEngine.CAM_Z / ParticleEngine.FOCAL;
    return { h, w: h * this.aspect };
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      if (now - this.lastFrame >= this.frameGap) {
        this.lastFrame = now;
        this.render();
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stopLoop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private upload(buf: WebGLBuffer, data: Float32Array) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  private render() {
    const gl = this.gl;
    const frames = this.keyframes;
    if (frames.length === 0) return;
    const time = (performance.now() - this.start) / 1000;

    this.intro = Math.min(1, (performance.now() - this.introStart) / 2600);

    const last = frames.length - 1;
    const g = Math.min(Math.max(this.current, 0), last);
    const i = Math.min(Math.floor(g), Math.max(last - 1, 0));
    const j = Math.min(i + 1, last);
    const t = last === 0 ? 0 : g - i;

    const A = frames[i];
    const B = frames[j];
    if (this.loaded[0] !== i || this.loaded[1] !== j) {
      this.upload(this.fromBuf, A.shape);
      this.upload(this.toBuf, B.shape);
      this.loaded = [i, j];
    }

    // Mouse: follow smoothly, and fade the push out when the mouse stops.
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.18;
    m.y += (m.ty - m.y) * 0.18;
    const moving = performance.now() - m.last < 900 ? 1 : 0;
    m.amt += (moving - m.amt) * 0.05;
    this.tiltMouse.x += (m.tx - this.tiltMouse.x) * 0.04;
    this.tiltMouse.y += (m.ty - this.tiltMouse.y) * 0.04;

    const te = smooth(t);
    const rotFor = (k: Keyframe, idx: number) =>
      k.spin > 0 ? time * 0.22 * k.spin + idx * 0.9 : k.turn + Math.sin(time * 0.45) * 0.22 * (1 - k.still);
    const still = lerp(A.still, B.still, te);
    const ry = lerp(rotFor(A, i), rotFor(B, j), te) + this.tiltMouse.x * 0.35 * (1 - still);
    const rx = lerp(A.tilt, B.tilt, te) - this.tiltMouse.y * 0.2 * (1 - still);
    const [cx, sx, cy, sy] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry)];
    // Column-major 3x3: rotate around y, then x. Reused every frame.
    const rot = this.rot;
    rot.set([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);

    const u = this.uniforms;
    gl.uniform1f(u.uT, t);
    gl.uniform1f(u.uScatter, A.shape === B.shape ? 0.15 : 1);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uIntro, this.intro);
    gl.uniformMatrix3fv(u.uRot, false, rot);
    gl.uniform1f(u.uScale, lerp(A.scale, B.scale, te));
    gl.uniform3f(u.uOffset, lerp(A.x, B.x, te), lerp(A.y, B.y, te), 0);
    gl.uniform1f(u.uAspect, this.aspect);
    gl.uniform2f(u.uMouse, m.x, m.y);
    gl.uniform1f(u.uMouseAmt, m.amt);
    gl.uniform1f(u.uSize, 2.1 * this.dpr);
    gl.uniform1f(u.uFlow, still);
    gl.uniform1f(u.uDust, this.dust);
    gl.uniform3fv(u.uColor, mixRgb(A.color, B.color, te));
    gl.uniform3fv(u.uAccent, mixRgb(A.accent, B.accent, te));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  destroy() {
    // Only stop drawing. Don't "lose" the WebGL context: React's dev mode
    // unmounts and remounts components, and the canvas hands the same
    // context back to the next engine.
    this.stopLoop();
  }
}
