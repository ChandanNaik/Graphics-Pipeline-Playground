import {useRef, useEffect} from 'react';
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'

type RenderMode = 'naive' | 'instanced' | 'merged' | 'lod' | 'frustum'

type SceneCanvasProps = {
  mode: RenderMode
  objectCount: number
  animate: boolean
}

export function SceneCanvas({ mode, objectCount, animate }: SceneCanvasProps) {

  const hostRef = useRef<HTMLDivElement>(null);
  const overLayRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      const host = hostRef.current;
      if(!host) return;

      // 1. Initialize the renderer

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      host.appendChild(renderer.domElement);

      // 2. Scene + Camera
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0f172a');

      const camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 1000);
      camera.position.set(100, 0, 0); 
      camera.lookAt(0, 0, 0);


      // 2.1 OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.target.set(0, 0, 0)
      controls.update()

      // 3. Geometry + Material + Mesh

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const fallbackMaterial = new THREE.MeshBasicMaterial({color: 'blue'});
      const cubes: THREE.Mesh[] = [];
      const cubeMaterials: THREE.MeshBasicMaterial[] = [];

      if(mode === 'naive'){
        // naive mode = one mesh per cube.
        const side = Math.ceil(Math.cbrt(objectCount));
        const cubeCount = side * side * side;
        const center = (side - 1) / 2;
        const spacing = 4;

        for(let i=0 ; i < cubeCount ; i++){
          const x = i % side;
          const z = Math.floor(i / side) % side;
          const y = Math.floor(i / (side * side));

          const t = z / Math.max(1, side - 1); // normalized z-layer [0,1]
          const color = new THREE.Color().setHSL(0.66 * (1 - t), 0.8, 0.5);
          const cubeMaterial = new THREE.MeshBasicMaterial({ color });
          cubeMaterials.push(cubeMaterial);

          const cube = new THREE.Mesh(geometry, cubeMaterial);

          cube.position.set(
            (x - center) * spacing,
            (y - center) * spacing,
            (z - center) * spacing
          )

          scene.add(cube);
          cubes.push(cube);
        }
      }
      else{
        // Temporary fallback until next steps implement other modes.
        const cube = new THREE.Mesh(geometry, fallbackMaterial)
        scene.add(cube)
        cubes.push(cube)
        }

      // 4. Animation loop
      let rafId = 0;
      let lastLog = performance.now();
      let prevFramMs = performance.now();

      const frameTimes: number[] = []
      const maxSamples = 60;

      const render = (now: number) => {
        const deltaMs = now - prevFramMs;
        prevFramMs = now;

        frameTimes.push(deltaMs);
        if (frameTimes.length > maxSamples) frameTimes.shift();

        const avgFrameMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;

        if (animate){
          cubes.forEach(cube => {
            // cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
          })
        }

        controls.update();
        renderer.render(scene, camera)
        // 4.1 Metrics panel

        if (now - lastLog > 1000){

          if (overLayRef.current){

            overLayRef.current.textContent = 
              `FPS: ${fps.toFixed(1)}\n` +
              `Frame: ${avgFrameMs.toFixed(2)} ms\n` +
              `Draw Calls: ${renderer.info.render.calls}\n` +
              `Triangles: ${renderer.info.render.triangles.toLocaleString()}`
          }
          lastLog = now;
        }
        rafId = requestAnimationFrame(render);
      }
      rafId = requestAnimationFrame(render);

      // 5. Resize handler

      const onResize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      window.addEventListener('resize', onResize);

      return () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize)

        cubes.forEach(cube => scene.remove(cube));

        geometry.dispose();
        cubeMaterials.forEach((cubeMaterial) => cubeMaterial.dispose());
        fallbackMaterial.dispose();
        controls.dispose()
        renderer.dispose();

        if (renderer.domElement.parentElement == host){
          host.removeChild(renderer.domElement);
        }
      }
    },
    [animate, objectCount, mode]
  );

  return(
    <div ref={hostRef} className="scene-host">
      <div className="header-container">
        <h1 className="header">Graphics Pipeline Playground</h1>
      </div>
      <div ref={overLayRef} className="debug-overlay"></div>
    </div>
  ) 
  
}
