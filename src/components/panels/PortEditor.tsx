import { v4 as uuid } from 'uuid'
import { useDiagramStore } from '../../store/diagramStore'
import type { Port } from '../../types/diagram'

interface PortEditorProps {
  nodeId: string
  ports: Port[]
}

export function PortEditor({ nodeId, ports }: PortEditorProps) {
  const addPort = useDiagramStore((s) => s.addPort)
  const updatePort = useDiagramStore((s) => s.updatePort)
  const removePort = useDiagramStore((s) => s.removePort)

  function handleAdd() {
    addPort(nodeId, { id: uuid(), type: 'eth', name: '' })
  }

  return (
    <div className="port-editor">
      <div className="port-editor-header">
        <span className="section-label">Steckplätze / Ports</span>
        <button className="btn-small btn-add" onClick={handleAdd}>+ Hinzufügen</button>
      </div>

      {ports.length === 0 && (
        <p className="empty-hint">Keine Ports konfiguriert.</p>
      )}

      {ports.map((port) => (
        <div key={port.id} className="port-row">
          <input
            className="port-input port-type"
            placeholder="Typ"
            value={port.type}
            onChange={(e) => updatePort(nodeId, port.id, { type: e.target.value })}
          />
          <input
            className="port-input port-name"
            placeholder="Name"
            value={port.name}
            onChange={(e) => updatePort(nodeId, port.id, { name: e.target.value })}
          />
          <button
            className="btn-small btn-remove"
            onClick={() => removePort(nodeId, port.id)}
            title="Port löschen"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
