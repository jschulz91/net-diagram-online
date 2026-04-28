import React from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import type { ProjectInfo } from '../../types/diagram'
import { PortEditor } from './PortEditor'
import { NODE_ICONS, NODE_COLORS, NODE_LABELS } from '../../constants/nodeDefinitions'

export function NodeInspector() {
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId)
  const selectedEdgeId = useDiagramStore((s) => s.selectedEdgeId)
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const updateNodeData = useDiagramStore((s) => s.updateNodeData)
  const updateNodeStyle = useDiagramStore((s) => s.updateNodeStyle)
  const removeNode = useDiagramStore((s) => s.removeNode)
  const duplicateNode = useDiagramStore((s) => s.duplicateNode)
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel)
  const removeEdge = useDiagramStore((s) => s.removeEdge)

  // ── Edge inspector ───────────────────────────────────
  if (selectedEdgeId) {
    const edge = edges.find((e) => e.id === selectedEdgeId)
    if (!edge) return <ProjectInfoEditor />

    // Resolve port names for display
    const srcNode = nodes.find((n) => n.id === edge.source)
    const tgtNode = nodes.find((n) => n.id === edge.target)
    const srcPort = srcNode?.data.ports.find((p) => p.id === edge.sourceHandle)
    const tgtPort = tgtNode?.data.ports.find((p) => p.id === edge.targetHandle)

    return (
      <div className="inspector">
        <div className="inspector-header" style={{ borderLeftColor: '#64748b' }}>
          <span className="inspector-icon">—</span>
          <span className="inspector-type">Verbindung</span>
        </div>

        <div className="edge-info">
          <div className="edge-endpoint">
            <span className="edge-ep-label">Von</span>
            <span className="edge-ep-value">
              {srcNode?.data.label ?? '?'} · {srcPort?.name ?? '?'}
            </span>
          </div>
          <div className="edge-endpoint">
            <span className="edge-ep-label">Nach</span>
            <span className="edge-ep-value">
              {tgtNode?.data.label ?? '?'} · {tgtPort?.name ?? '?'}
            </span>
          </div>
        </div>

        <div className="inspector-field">
          <label className="field-label">Beschriftung</label>
          <input
            className="field-input nodrag"
            placeholder="z.B. 10GbE Trunk, VLAN 10…"
            value={typeof edge.label === 'string' ? edge.label : (edge.data?.label ?? '')}
            onChange={(e) => updateEdgeLabel(selectedEdgeId, e.target.value)}
          />
        </div>

        <div className="inspector-footer">
          <button className="btn-delete" onClick={() => removeEdge(selectedEdgeId)}>
            Verbindung löschen
          </button>
        </div>
      </div>
    )
  }

  // ── Node inspector ───────────────────────────────────
  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return <ProjectInfoEditor />

  const { data } = node
  const color = NODE_COLORS[data.nodeType]
  const icon = NODE_ICONS[data.nodeType]
  const typeName = NODE_LABELS[data.nodeType]

  return (
    <div className="inspector">
      <div className="inspector-header" style={{ borderLeftColor: color }}>
        <span className="inspector-icon">{icon}</span>
        <span className="inspector-type">{typeName}</span>
      </div>

      <div className="inspector-field">
        <label className="field-label">Name</label>
        <input
          className="field-input nodrag"
          value={data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
        />
      </div>

      {data.nodeType !== 'zone' && (
        <div className="inspector-field">
          <label className="field-label">Größe</label>
          <div className="size-switcher">
            {([['M', {}], ['L', { width: 220 }], ['XL', { width: 300 }]] as const).map(([label, style]) => {
              const w = (node.style as React.CSSProperties | undefined)?.width
              const active =
                label === 'M' ? !w || w === 130 :
                label === 'L' ? w === 220 :
                w === 300
              return (
                <button
                  key={label}
                  className={`side-btn ${active ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeStyle(node.id, style)}
                >{label}</button>
              )
            })}
          </div>
        </div>
      )}

      {data.nodeType === 'custom' && (
        <div className="inspector-field">
          <label className="field-label">Farbe</label>
          <div className="color-picker-row">
            <input
              type="color"
              className="color-input nodrag"
              value={data.customColor ?? '#6366f1'}
              onChange={(e) => updateNodeData(node.id, { customColor: e.target.value })}
            />
            <span className="color-value">{data.customColor ?? '#6366f1'}</span>
          </div>
        </div>
      )}

      {data.nodeType !== 'zone' && data.nodeType !== 'custom' && (
        <div className="inspector-field">
          <label className="field-label">Port-Seite</label>
          <div className="port-side-switcher">
            <button
              className={`side-btn ${(data.portSide ?? 'right') === 'left' ? 'side-btn-active' : ''}`}
              onClick={() => updateNodeData(node.id, { portSide: 'left' })}
            >◀ Links</button>
            <button
              className={`side-btn ${(data.portSide ?? 'right') === 'right' ? 'side-btn-active' : ''}`}
              onClick={() => updateNodeData(node.id, { portSide: 'right' })}
            >Rechts ▶</button>
          </div>
        </div>
      )}

      <div className="inspector-field">
        <label className="field-label">Beschreibung</label>
        <textarea
          className="field-textarea nodrag"
          rows={2}
          value={data.description ?? ''}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          placeholder="Optional..."
        />
      </div>

      {data.nodeType !== 'zone' && (
        <>
          {data.nodeType === 'custom' && (
            <div className="inspector-field">
              <label className="field-label">Port-Seite</label>
              <div className="port-side-switcher">
                <button
                  className={`side-btn ${(data.portSide ?? 'right') === 'left' ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeData(node.id, { portSide: 'left' })}
                >◀ Links</button>
                <button
                  className={`side-btn ${(data.portSide ?? 'right') === 'right' ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeData(node.id, { portSide: 'right' })}
                >Rechts ▶</button>
              </div>
            </div>
          )}
          <PortEditor nodeId={node.id} ports={data.ports} />
        </>
      )}

      <div className="inspector-footer">
        <button className="btn-duplicate" onClick={() => duplicateNode(node.id)}>
          Duplizieren
        </button>
        <button className="btn-delete" onClick={() => removeNode(node.id)}>
          Löschen
        </button>
      </div>
    </div>
  )
}

function ProjectInfoEditor() {
  const info = useDiagramStore((s) => s.projectInfo)
  const update = useDiagramStore((s) => s.updateProjectInfo)

  const fields: { key: keyof ProjectInfo; label: string }[] = [
    { key: 'name',    label: 'Projektname' },
    { key: 'creator', label: 'Ersteller'   },
    { key: 'date',    label: 'Datum'       },
    { key: 'version', label: 'Version'     },
  ]

  return (
    <div className="inspector">
      <div className="inspector-header" style={{ borderLeftColor: '#64748b' }}>
        <span className="inspector-icon">📋</span>
        <span className="inspector-type">Projektinfo</span>
      </div>

      {fields.map(({ key, label }) => (
        <div className="inspector-field" key={key}>
          <label className="field-label">{label}</label>
          <input
            className="field-input nodrag"
            value={info[key]}
            placeholder={label}
            onChange={(e) => update({ [key]: e.target.value })}
          />
        </div>
      ))}

      <div className="inspector-field">
        <label className="field-label">Beschreibung</label>
        <textarea
          className="field-textarea nodrag"
          rows={3}
          value={info.description}
          placeholder="Beschreibung…"
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <p className="inspector-hint">
        Klicke auf ein Element oder eine Verbindung um es zu bearbeiten.
      </p>
    </div>
  )
}
