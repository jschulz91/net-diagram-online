import { ReactFlowProvider } from 'reactflow'
import { DiagramCanvas } from './components/canvas/DiagramCanvas'
import { Toolbar } from './components/panels/Toolbar'
import { NodeInspector } from './components/panels/NodeInspector'

export default function App() {
  return (
    <ReactFlowProvider>
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
    </ReactFlowProvider>
  )
}
