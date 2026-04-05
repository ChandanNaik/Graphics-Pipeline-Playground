# Graphics Pipeline Playground (Scaffold)

This repo is intentionally minimal so you can build the core parts step by step for interview prep.

## Current State

- React + TypeScript + Vite app
- Basic control panel (`mode`, `objectCount`, `animate`)
- `SceneCanvas` placeholder component where you will implement Three.js
- No rendering logic, no metrics logic, no WASM logic yet

## Run

```bash
npm install
npm run dev
```

## Build Plan (Recommended Order)

1. **Renderer bootstrap**
   - In `src/components/SceneCanvas.tsx`, mount `WebGLRenderer`
   - Add a `Scene`, `PerspectiveCamera`, one mesh, and animation loop
2. **Naive mode**
   - Create N separate meshes for cubes
   - Verify FPS drop as count grows
3. **Instanced mode**
   - Replace with `THREE.InstancedMesh`
   - Compare draw calls and frame time
4. **Metrics panel**
   - Add `renderer.info` metrics + FPS + frame time
5. **Merged / LOD / Frustum**
   - Implement each mode one by one
   - Record observations per mode
6. **WASM benchmark**
   - Add C++ matrix or culling benchmark
   - Compare JS vs WASM including transfer overhead

## Suggested Interview Notes Template

For each experiment, log:

- Hypothesis
- Scene setup (object count, mode, camera behavior)
- Metrics observed (FPS, frame time, draw calls, triangles)
- Bottleneck interpretation (CPU submission vs GPU shading)
- Tradeoff + next optimization
