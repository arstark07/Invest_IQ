// "use client";

// import { Canvas, useFrame } from '@react-three/fiber';
// import { useRef, useMemo } from 'react';
// import * as THREE from 'three';

// function SilkMesh({ speed = 5, scale = 1, color = "#7B7481", noiseIntensity = 1.5, rotation = 0 }) {
//   const meshRef = useRef();
//   const materialRef = useRef();

//   // Vertex shader for silk effect
//   const vertexShader = `
//     varying vec2 vUv;
//     varying vec3 vPosition;
//     uniform float uTime;
//     uniform float uNoiseIntensity;
    
//     // Simplex noise function
//     vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
//     vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
//     vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
//     vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
//     float snoise(vec3 v) {
//       const vec2 C = vec2(1.0/6.0, 1.0/3.0);
//       const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
//       vec3 i  = floor(v + dot(v, C.yyy));
//       vec3 x0 = v - i + dot(i, C.xxx);
      
//       vec3 g = step(x0.yzx, x0.xyz);
//       vec3 l = 1.0 - g;
//       vec3 i1 = min(g.xyz, l.zxy);
//       vec3 i2 = max(g.xyz, l.zxy);
      
//       vec3 x1 = x0 - i1 + C.xxx;
//       vec3 x2 = x0 - i2 + C.yyy;
//       vec3 x3 = x0 - D.yyy;
      
//       i = mod289(i);
//       vec4 p = permute(permute(permute(
//         i.z + vec4(0.0, i1.z, i2.z, 1.0))
//         + i.y + vec4(0.0, i1.y, i2.y, 1.0))
//         + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
//       float n_ = 0.142857142857;
//       vec3 ns = n_ * D.wyz - D.xzx;
      
//       vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
//       vec4 x_ = floor(j * ns.z);
//       vec4 y_ = floor(j - 7.0 * x_);
      
//       vec4 x = x_ *ns.x + ns.yyyy;
//       vec4 y = y_ *ns.x + ns.yyyy;
//       vec4 h = 1.0 - abs(x) - abs(y);
      
//       vec4 b0 = vec4(x.xy, y.xy);
//       vec4 b1 = vec4(x.zw, y.zw);
      
//       vec4 s0 = floor(b0)*2.0 + 1.0;
//       vec4 s1 = floor(b1)*2.0 + 1.0;
//       vec4 sh = -step(h, vec4(0.0));
      
//       vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
//       vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
//       vec3 p0 = vec3(a0.xy, h.x);
//       vec3 p1 = vec3(a0.zw, h.y);
//       vec3 p2 = vec3(a1.xy, h.z);
//       vec3 p3 = vec3(a1.zw, h.w);
      
//       vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
//       p0 *= norm.x;
//       p1 *= norm.y;
//       p2 *= norm.z;
//       p3 *= norm.w;
      
//       vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
//       m = m * m;
//       return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
//     }
    
//     void main() {
//       vUv = uv;
//       vPosition = position;
      
//       vec3 pos = position;
//       float noise = snoise(vec3(pos.x * 0.5, pos.y * 0.5, uTime * 0.3));
//       noise += snoise(vec3(pos.x * 1.0, pos.y * 1.0, uTime * 0.2)) * 0.5;
      
//       pos.z += noise * uNoiseIntensity;
      
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
//     }
//   `;

//   // Fragment shader for silk effect - React Bits style
//   const fragmentShader = `
//     varying vec2 vUv;
//     varying vec3 vPosition;
//     uniform float uTime;
//     uniform vec3 uColor;
//     uniform float uNoiseIntensity;
    
//     // Simplex noise for fragment shader
//     vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
//     vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
//     vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
//     vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
//     float snoise(vec3 v) {
//       const vec2 C = vec2(1.0/6.0, 1.0/3.0);
//       const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
//       vec3 i  = floor(v + dot(v, C.yyy));
//       vec3 x0 = v - i + dot(i, C.xxx);
//       vec3 g = step(x0.yzx, x0.xyz);
//       vec3 l = 1.0 - g;
//       vec3 i1 = min(g.xyz, l.zxy);
//       vec3 i2 = max(g.xyz, l.zxy);
//       vec3 x1 = x0 - i1 + C.xxx;
//       vec3 x2 = x0 - i2 + C.yyy;
//       vec3 x3 = x0 - D.yyy;
//       i = mod289(i);
//       vec4 p = permute(permute(permute(
//         i.z + vec4(0.0, i1.z, i2.z, 1.0))
//         + i.y + vec4(0.0, i1.y, i2.y, 1.0))
//         + i.x + vec4(0.0, i1.x, i2.x, 1.0));
//       float n_ = 0.142857142857;
//       vec3 ns = n_ * D.wyz - D.xzx;
//       vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
//       vec4 x_ = floor(j * ns.z);
//       vec4 y_ = floor(j - 7.0 * x_);
//       vec4 x = x_ *ns.x + ns.yyyy;
//       vec4 y = y_ *ns.x + ns.yyyy;
//       vec4 h = 1.0 - abs(x) - abs(y);
//       vec4 b0 = vec4(x.xy, y.xy);
//       vec4 b1 = vec4(x.zw, y.zw);
//       vec4 s0 = floor(b0)*2.0 + 1.0;
//       vec4 s1 = floor(b1)*2.0 + 1.0;
//       vec4 sh = -step(h, vec4(0.0));
//       vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
//       vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
//       vec3 p0 = vec3(a0.xy, h.x);
//       vec3 p1 = vec3(a0.zw, h.y);
//       vec3 p2 = vec3(a1.xy, h.z);
//       vec3 p3 = vec3(a1.zw, h.w);
//       vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
//       p0 *= norm.x;
//       p1 *= norm.y;
//       p2 *= norm.z;
//       p3 *= norm.w;
//       vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
//       m = m * m;
//       return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
//     }
    
//     void main() {
//       vec2 uv = vUv;
      
//       // Time for animation
//       float time = uTime * 0.1;
      
//       // Create strong diagonal coordinates for silk draping effect
//       float diag = (uv.x - uv.y) * 3.0;
      
//       // Multiple noise layers for texture
//       float noise1 = snoise(vec3(uv * 2.0, time * 0.5));
//       float noise2 = snoise(vec3(uv * 3.0, time * 0.3));
      
//       // Create prominent diagonal waves - this is the key for silk effect
//       float wave1 = sin(diag + time * 2.0 + noise1 * 1.5) * 0.5 + 0.5;
//       float wave2 = sin(diag * 1.3 - time * 1.5 + noise2) * 0.5 + 0.5;
//       float wave3 = sin(diag * 0.7 + time + noise1 * 0.5) * 0.5 + 0.5;
      
//       // Combine waves for silk draping
//       float combinedWave = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
      
//       // Bright, vibrant purple-blue color palette matching React Bits
//       vec3 color1 = vec3(0.35, 0.15, 0.75); // Bright purple
//       vec3 color2 = vec3(0.50, 0.25, 0.90); // Very bright purple
//       vec3 color3 = vec3(0.25, 0.10, 0.60); // Medium purple
//       vec3 color4 = vec3(0.40, 0.20, 0.85); // Bright purple-blue
//       vec3 color5 = vec3(0.20, 0.08, 0.50); // Deep purple
//       vec3 color6 = vec3(0.60, 0.35, 1.00); // Ultra bright purple highlight
      
//       // Create silk-like color transitions based on waves
//       vec3 baseColor = mix(color1, color2, wave1);
//       baseColor = mix(baseColor, color3, wave2 * 0.5);
//       baseColor = mix(baseColor, color4, wave3 * 0.3);
      
//       // Add strong highlights for silk sheen - this creates the fabric look
//       float highlight = pow(wave1, 1.5) * pow(wave2, 2.0);
//       baseColor = mix(baseColor, color6, highlight * 0.5);
      
//       // Add depth variation from vertex position
//       float depth = (vPosition.z + uNoiseIntensity) / (uNoiseIntensity * 2.0);
//       baseColor *= 0.85 + depth * 0.15;
      
//       // Create dark valleys between waves for fabric-like depth
//       float valley = 1.0 - pow(combinedWave, 0.5);
//       baseColor = mix(baseColor, color5, valley * 0.3);
      
//       // Add subtle shimmer along wave peaks
//       float shimmer = pow(wave1, 3.0) * pow(wave2, 2.5);
//       baseColor += vec3(shimmer * 0.15);
      
//       // Increase overall brightness to match React Bits
//       baseColor *= 1.2;
      
//       gl_FragColor = vec4(baseColor, 1.0);
//     }
//   `;

//   const uniforms = useMemo(() => ({
//     uTime: { value: 0 },
//     uColor: { value: new THREE.Color(color) },
//     uNoiseIntensity: { value: noiseIntensity }
//   }), [color, noiseIntensity]);

//   useFrame((state) => {
//     if (materialRef.current) {
//       materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * speed * 0.1;
//     }
//     if (meshRef.current) {
//       meshRef.current.rotation.z = rotation * Math.PI / 180;
//     }
//   });

//   return (
//     <mesh ref={meshRef} scale={scale}>
//       <planeGeometry args={[20, 20, 64, 64]} />
//       <shaderMaterial
//         ref={materialRef}
//         vertexShader={vertexShader}
//         fragmentShader={fragmentShader}
//         uniforms={uniforms}
//         transparent
//         side={THREE.DoubleSide}
//       />
//     </mesh>
//   );
// }

// export default function Silk({ speed = 5, scale = 1, color = "#7B7481", noiseIntensity = 1.5, rotation = 0 }) {
//   return (
//     <div className="fixed inset-0 -z-10 bg-[#1e0a3d]">
//       <Canvas
//         camera={{ position: [0, 0, 5], fov: 75 }}
//         style={{ background: 'transparent' }}
//       >
//         <ambientLight intensity={0.5} />
//         <SilkMesh
//           speed={speed}
//           scale={scale}
//           color={color}
//           noiseIntensity={noiseIntensity}
//           rotation={rotation}
//         />
//       </Canvas>
//     </div>
//   );
// }


"use client";

/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useRef, useMemo, useLayoutEffect } from 'react';
import { Color } from 'three';

const hexToNormalizedRGB = hex => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

const SilkPlane = forwardRef(function SilkPlane({ uniforms }, ref) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_, delta) => {
    ref.current.material.uniforms.uTime.value += 0.1 * delta;
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = 'SilkPlane';

const Silk = ({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }) => {
  const meshRef = useRef();

  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0e27]">
      <Canvas dpr={[1, 2]} frameloop="always" style={{ background: 'transparent' }}>
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;
