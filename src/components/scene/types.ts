import * as THREE from 'three';

export type RenderMode = 'naive' | 'instanced' | 'merged' | 'lod' | 'frustum';

export type ModeBuildResult = {
  animatedMeshes: THREE.Mesh[];
  dispose: () => void;
};

export type BuildModeParams = {
  scene: THREE.Scene;
  objectCount: number;
};