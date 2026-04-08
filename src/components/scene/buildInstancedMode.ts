import * as THREE from "three";
import type { BuildModeParams, ModeBuildResult } from "./types";

export function buildInstanceMode({
  scene,
  objectCount,
  camera,
}: BuildModeParams): ModeBuildResult {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const side = Math.ceil(Math.cbrt(objectCount));
  const cubeCount = side * side * side;
  const center = (side - 1) / 2;
  const spacing = 4;

  const instancedMesh = new THREE.InstancedMesh(geometry, material, cubeCount);
  const instancedCube = new THREE.Object3D();

  const basePositions = new Float32Array(cubeCount * 3);
  const angles = new Float32Array(cubeCount);
  const colors = new Float32Array(cubeCount * 3);
  const color = new THREE.Color();

  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  for (let i = 0; i < cubeCount; i++) {
    const x = i % side;
    const z = Math.floor(i / side) % side;
    const y = Math.floor(i / (side * side));

    const px = (x - center) * spacing;
    const py = (y - center) * spacing;
    const pz = (z - center) * spacing;

    basePositions[i * 3] = px;
    basePositions[i * 3 + 1] = py;
    basePositions[i * 3 + 2] = pz;

    angles[i] = 0;

    instancedCube.position.set(px, py, pz);
    instancedCube.rotation.set(0, 0, 0);
    instancedCube.scale.set(1, 1, 1);
    instancedCube.updateMatrix();
    instancedMesh.setMatrixAt(i, instancedCube.matrix);

    const t = z / Math.max(1, side - 1);
    color.setHSL(0.66 * (1 - t), 0.8, 0.5);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }

  scene.add(instancedMesh);

  const instancedAnimationFrame = (deltaMs: number) => {
    const deltaSec = deltaMs / 1000;
    const speed = 1.2;
    if (!camera) {
      return;
    }
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    let visibleCount = 0;
    for (let i = 0; i < cubeCount; i++) {
      angles[i] += speed * deltaSec;
      instancedCube.position.set(
        basePositions[i * 3],
        basePositions[i * 3 + 1],
        basePositions[i * 3 + 2],
      );
      if (!frustum.containsPoint(instancedCube.position)) continue;
      instancedCube.rotation.set(0, angles[i], 0);
      instancedCube.scale.set(1, 1, 1);
      instancedCube.updateMatrix();
      instancedMesh.setMatrixAt(visibleCount, instancedCube.matrix);
      visibleCount++;
    }
    instancedMesh.count = visibleCount;
    instancedMesh.instanceMatrix.needsUpdate = true;
  };

  return {
    animatedMeshes: [instancedMesh],
    animationFrame: instancedAnimationFrame,
    dispose: () => {
      scene.remove(instancedMesh);
      geometry.dispose();
      material.dispose();
      basePositions.fill(0);
      angles.fill(0);
      colors.fill(0);
    },
  };
}
