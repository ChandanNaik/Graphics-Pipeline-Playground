import { SceneCanvas } from './components/SceneCanvas'

function App() {
  return (
    <main>
      <SceneCanvas mode="naive" objectCount={5000} animate={true} />
    </main>
  )
}

export default App
