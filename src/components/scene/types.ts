import * as THREE from "three";

export type RenderMode = "naive" | "instanced" | "merged" | "lod" | "frustum";

export type ModeBuildResult = {
  animatedMeshes: THREE.Mesh[];
  animationFrame?: (deltaMs: number) => void;
  dispose: () => void;
};

export type BuildModeParams = {
  scene: THREE.Scene;
  objectCount: number;
};
