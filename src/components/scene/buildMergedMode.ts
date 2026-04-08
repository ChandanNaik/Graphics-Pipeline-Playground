import * as THREE from "three";
import type { BuildModeParams, ModeBuildResult } from "./types";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function buildMergedMode({
  scene,
  objectCount,
}: BuildModeParams): ModeBuildResult {
  const side = Math.ceil(Math.cbrt(objectCount));
  const cubeCount = side * side * side;
  const center = (side - 1) / 2;
  const spacing = 4;

  const sourceGeometries: THREE.BufferGeometry[] = [];
  const baseGeometry = new THREE.BoxGeometry(1, 1, 1);

  for (let i = 0; i < cubeCount; i++) {
    const x = i % side;
    const z = Math.floor(i / side) % side;
    const y = Math.floor(i / (side * side));
    const px = (x - center) * spacing;
    const py = (y - center) * spacing;
    const pz = (z - center) * spacing;

    const g = baseGeometry.clone();

    const t = z / Math.max(1, side - 1);
    const color = new THREE.Color().setHSL(0.66 * (1 - t), 0.8, 0.5);
    const positionAttr = g.getAttribute("position");
    const colorArray = new Float32Array(positionAttr.count * 3);

    for (let v = 0; v < positionAttr.count; v++) {
      colorArray[v * 3] = color.r;
      colorArray[v * 3 + 1] = color.g;
      colorArray[v * 3 + 2] = color.b;
    }

    g.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
    g.translate(px, py, pz);
    sourceGeometries.push(g);
  }

  const mergedGeometry = mergeGeometries(sourceGeometries, false);
  sourceGeometries.forEach((g) => g.dispose());

  if (!mergedGeometry) {
    throw new Error("Failed to merge geometries");
  }

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    wireframe: false,
  });
  const mergedMesh = new THREE.Mesh(mergedGeometry, material);
  scene.add(mergedMesh);

  const mergedAnimationFrame = (deltaMs: number) => {
    const deltaSec = deltaMs / 1000;
    mergedMesh.rotation.y += 0.6 * deltaSec;
  };

  return {
    animatedMeshes: [mergedMesh],
    animationFrame: mergedAnimationFrame,
    dispose: () => {
      scene.remove(mergedMesh);
      mergedGeometry.dispose();
      material.dispose();
      baseGeometry.dispose();
    },
  };
}
