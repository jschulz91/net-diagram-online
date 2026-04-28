import { useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { DiagramCanvas } from './components/canvas/DiagramCanvas'
import { Toolbar } from './components/panels/Toolbar'
import { NodeInspector } from './components/panels/NodeInspector'
import { useDiagramStore } from './store/diagramStore'
import { decodeFromHash } from './utils/serialization'

function AppInner() {
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)

  useEffect(() => {
    const result = decodeFromHash(window.location.hash)
    if (result) {
      loadDiagram(result)
      // Clean the hash after loading so reloads don't re-trigger (optional)
      // window.history.replaceState(null, '', window.location.pathname)
    }
  }, [loadDiagram])

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-logo">🌐</span>
        <span className="app-title">Netzwerkdiagramm</span>
      </header>
      <div className="app-body">
        <aside className="sidebar-left">
          <Toolbar />
        </aside>
        <main className="canvas-area">
          <DiagramCanvas />
        </main>
        <aside className="sidebar-right">
          <NodeInspector />
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
