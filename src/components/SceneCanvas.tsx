import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildNaiveMode } from "./scene/buildNaiveMode";
import { buildInstanceMode } from "./scene/buildInstancedMode";
import type {
  BuildModeParams,
  ModeBuildResult,
  RenderMode,
} from "./scene/types";

type SceneCanvasProps = {
  mode: RenderMode;
  objectCount: number;
  animate: boolean;
};

function buildFallbackMode({ scene }: BuildModeParams): ModeBuildResult {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: "blue" });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  return {
    animatedMeshes: [cube],
    dispose: () => {
      scene.remove(cube);
      material.dispose();
      geometry.dispose();
    },
  };
}

const modeBuilders: Record<
  RenderMode,
  (params: BuildModeParams) => ModeBuildResult
> = {
  naive: buildNaiveMode,
  instanced: buildInstanceMode,
  merged: buildFallbackMode,
  lod: buildFallbackMode,
  frustum: buildFallbackMode,
};

function getMaxOrbitDistance(mode: RenderMode, objectCount: number): number {
  if (mode !== "naive" && mode !== "instanced") {
    return 25;
  }

  const side = Math.ceil(Math.cbrt(objectCount));
  const spacing = 4;
  const halfExtent = ((side - 1) * spacing) / 2;
  const boundingRadius = Math.sqrt(3 * halfExtent * halfExtent) + 1;

  // Keep room to orbit, but cap zooming out so cubes remain readable.
  return Math.max(25, boundingRadius * 3);
}

export function SceneCanvas({ mode, objectCount, animate }: SceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // 1. Initialize the renderer

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    // 2. Scene + Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / host.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(100, 0, 0);
    camera.lookAt(0, 0, 0);

    // 2.1 OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = getMaxOrbitDistance(mode, objectCount);
    controls.target.set(0, 0, 0);
    controls.update();

    // 3. Build meshes for the selected render mode.
    const modeResult = modeBuilders[mode]({ scene, objectCount });

    // 4. Animation loop
    let rafId = 0;
    let lastLog = performance.now();
    let prevFrameMs = performance.now();

    const frameTimes: number[] = [];
    const maxSamples = 60;

    const render = (now: number) => {
      const deltaMs = now - prevFrameMs;
      prevFrameMs = now;

      frameTimes.push(deltaMs);
      if (frameTimes.length > maxSamples) frameTimes.shift();

      const avgFrameMs =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;

      if (animate) {
        modeResult.animationFrame?.(deltaMs);
      }

      controls.update();
      renderer.render(scene, camera);
      // 4.1 Metrics panel

      if (now - lastLog > 1000) {
        if (overlayRef.current) {
          overlayRef.current.textContent =
            `FPS: ${fps.toFixed(1)}\n` +
            `Frame: ${avgFrameMs.toFixed(2)} ms\n` +
            `Draw Calls: ${renderer.info.render.calls}\n` +
            `Triangles: ${renderer.info.render.triangles.toLocaleString()}`;
        }
        lastLog = now;
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    // 5. Resize handler

    const onResize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);

      modeResult.dispose();
      controls.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [animate, objectCount, mode]);

  return (
    <div ref={hostRef} className="scene-host">
      <div className="header-container">
        <h1 className="header">Graphics Pipeline Playground</h1>
      </div>
      <div ref={overlayRef} className="debug-overlay"></div>
    </div>
  );
}
