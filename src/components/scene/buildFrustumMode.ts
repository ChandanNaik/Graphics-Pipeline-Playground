import * as THREE from "three";
import type { BuildModeParams, ModeBuildResult } from "./types";

export function buildFrustumMode({
  scene,
  objectCount,
  camera,
}: BuildModeParams): ModeBuildResult {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cubes: THREE.Mesh[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];

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

  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();
  const worldPos = new THREE.Vector3();

  const frustumAnimationFrame = (deltaMs: number) => {
    const deltaSec = deltaMs / 1000;

    for (let i = 0; i < cubes.length; i++) {
      cubes[i].rotation.y += 0.8 * deltaSec;
    }

    if (!camera) {
      return;
    }

    camera.updateProjectionMatrix();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      cube.getWorldPosition(worldPos);
      cube.visible = frustum.containsPoint(worldPos);
    }
  };

  return {
    animatedMeshes: cubes,
    animationFrame: frustumAnimationFrame,
    dispose: () => {
      cubes.forEach((cube) => scene.remove(cube));
      geometry.dispose();
      materials.forEach((material) => material.dispose());
    },
  };
}
