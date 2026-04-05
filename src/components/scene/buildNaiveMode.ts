import * as THREE from "three";
import type { BuildModeParams, ModeBuildResult } from "./types";

export function buildNaiveMode({
  scene,
  objectCount,
}: BuildModeParams): ModeBuildResult {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials: THREE.MeshBasicMaterial[] = [];
  const cubes: THREE.Mesh[] = [];

  const side = Math.ceil(Math.cbrt(objectCount));
  const cubeCount = side * side * side;
  const center = (side - 1) / 2;
  const spacing = 4;

  for (let i = 0; i < cubeCount; i++) {
    const x = i % side;
    const z = Math.floor(i / side) % side;
    const y = Math.floor(i / (side * side));

    const t = z / Math.max(1, side - 1);
    const color = new THREE.Color().setHSL(0.66 * (1 - t), 0.8, 0.5);
    const material = new THREE.MeshBasicMaterial({ color });
    materials.push(material);

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(
      (x - center) * spacing,
      (y - center) * spacing,
      (z - center) * spacing,
    );

    scene.add(cube);
    cubes.push(cube);
  }
  const naiveAnimationFrame = (deltaMs: number) => {
    cubes.forEach((cube) => {
      cube.rotation.y += 2 * (deltaMs / 1000);
    });
  };

  return {
    animatedMeshes: cubes,
    animationFrame: naiveAnimationFrame,
    dispose: () => {
      cubes.forEach((cube) => scene.remove(cube));
      materials.forEach((m) => m.dispose());
      geometry.dispose();
    },
  };
}
