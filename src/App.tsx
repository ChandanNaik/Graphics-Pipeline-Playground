import { useState } from "react";
import type { RenderMode } from "./components/scene/types";
import { SceneCanvas } from "./components/SceneCanvas";

function App() {
  const [mode, setMode] = useState<RenderMode>("naive");
  const [objectCount, setObjectCount] = useState(1000);

  return (
    <main>
      <section style={{ display: "flex", gap: "0.75rem", padding: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RenderMode)}
          >
            <option value="naive">naive</option>
            <option value="instanced">instanced</option>
            <option value="merged">merged</option>
            <option value="lod">lod</option>
            <option value="frustum">frustum</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          Object Count
          <input
            type="number"
            min={1}
            step={100}
            value={objectCount}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              setObjectCount(Number.isFinite(parsed) ? Math.max(1, parsed) : 1);
            }}
          />
        </label>
      </section>

      <SceneCanvas mode={mode} objectCount={objectCount} animate={true} />
    </main>
  );
}

export default App;
