import React, { useState } from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import type { ProjectInfo } from '../../types/diagram'
import { PortEditor } from './PortEditor'
import { NODE_ICONS, NODE_COLORS, NODE_LABELS, DEFAULT_RACK_COLSPAN } from '../../constants/nodeDefinitions'

const DEFAULT_EDGE_COLOR = '#64748b'

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
  const updateEdgeColor = useDiagramStore((s) => s.updateEdgeColor)
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData)
  const removeEdge = useDiagramStore((s) => s.removeEdge)
  const removeFromRack = useDiagramStore((s) => s.removeFromRack)
  const updateRackSlot = useDiagramStore((s) => s.updateRackSlot)

  // ── Edge inspector ───────────────────────────────────
  if (selectedEdgeId) {
    const edge = edges.find((e) => e.id === selectedEdgeId)
    if (!edge) return <ProjectInfoEditor />

    const srcNode = nodes.find((n) => n.id === edge.source)
    const tgtNode = nodes.find((n) => n.id === edge.target)
    const srcPort = srcNode?.data.ports.find((p) => p.id === edge.sourceHandle)
    const tgtPort = tgtNode?.data.ports.find((p) => p.id === edge.targetHandle)
    const currentColor = edge.data?.color ?? ''

    return (
      <div className="inspector">
        <div className="inspector-header" style={{ borderLeftColor: currentColor || DEFAULT_EDGE_COLOR }}>
          <span className="inspector-icon">—</span>
          <span className="inspector-type">Verbindung</span>
        </div>

        <div className="edge-info">
          <div className="edge-endpoint">
            <span className="edge-ep-label">Von</span>
            <span className="edge-ep-value">{srcNode?.data.label ?? '?'} · {srcPort?.name ?? '?'}</span>
          </div>
          <div className="edge-endpoint">
            <span className="edge-ep-label">Nach</span>
            <span className="edge-ep-value">{tgtNode?.data.label ?? '?'} · {tgtPort?.name ?? '?'}</span>
          </div>
        </div>

        <div className="inspector-field">
          <label className="field-label">Beschriftung</label>
          <input
            className="field-input nodrag"
            placeholder="z.B. 10GbE Trunk…"
            value={typeof edge.label === 'string' ? edge.label : (edge.data?.label ?? '')}
            onChange={(e) => updateEdgeLabel(selectedEdgeId, e.target.value)}
          />
        </div>

        <div className="inspector-field">
          <label className="field-label">Farbe</label>
          <ColorInput
            value={currentColor || DEFAULT_EDGE_COLOR}
            onChange={(c) => updateEdgeColor(selectedEdgeId, c)}
            onReset={currentColor ? () => updateEdgeColor(selectedEdgeId, '') : undefined}
          />
        </div>

        <div className="inspector-field">
          <label className="field-label">Stil</label>
          <label className="toggle-row nodrag">
            <input
              type="checkbox"
              checked={edge.data?.dashed ?? false}
              onChange={(e) => updateEdgeData(selectedEdgeId, { dashed: e.target.checked || undefined })}
            />
            <span>Gestrichelt</span>
          </label>
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

  // ── Rack inspector ───────────────────────────────────
  if (data.nodeType === 'rack') {
    const slots = data.rackSlots ?? []
    const sortedSlots = [...slots].sort((a, b) => a.uRow - b.uRow || a.colStart - b.colStart)

    return (
      <div className="inspector">
        <div className="inspector-header" style={{ borderLeftColor: color }}>
          <span className="inspector-icon">{icon}</span>
          <span className="inspector-type">{typeName}</span>
        </div>

        <div className="inspector-field">
          <label className="field-label">Name</label>
          <input className="field-input nodrag" value={data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })} />
        </div>

        <div className="inspector-field">
          <label className="field-label">Rack-Einheiten (U)</label>
          <input type="number" className="field-input nodrag" min={1} max={48}
            value={data.rackUnits ?? 12}
            onChange={(e) => updateNodeData(node.id, { rackUnits: Math.max(1, Math.min(48, Number(e.target.value))) })} />
        </div>

        <div className="inspector-field">
          <label className="field-label">Kabel</label>
          <label className="toggle-row nodrag">
            <input type="checkbox" checked={!data.hideCables}
              onChange={(e) => updateNodeData(node.id, { hideCables: !e.target.checked })} />
            <span>{data.hideCables ? 'Ausgeblendet' : 'Sichtbar'}</span>
          </label>
        </div>

        <div className="inspector-field">
          <label className="field-label">Belegte Plätze ({sortedSlots.length})</label>
          {sortedSlots.length === 0 ? (
            <p className="empty-hint">Noch keine Geräte. Element auswählen → „Zum Rack hinzufügen"</p>
          ) : (
            <div className="rack-children-list">
              {sortedSlots.map((slot) => {
                const refNode = nodes.find((n) => n.id === slot.nodeId)
                return (
                  <div key={slot.nodeId} className="rack-child-row">
                    <span className="rack-u-badge">U{slot.uRow}</span>
                    <span className="rack-child-name">{refNode?.data.label ?? slot.nodeId.slice(0, 8)}</span>
                    <input
                      type="number" min={1} max={5}
                      className="rack-span-input nodrag"
                      value={slot.colSpan}
                      title="Spaltenbreite (1–5)"
                      onChange={(e) => updateRackSlot(node.id, slot.nodeId, { colSpan: Math.max(1, Math.min(5, Number(e.target.value))) })}
                    />
                    <button className="btn-small btn-remove" title="Aus Rack entfernen"
                      onClick={() => removeFromRack(node.id, slot.nodeId)}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="inspector-field">
          <label className="field-label">Beschreibung</label>
          <textarea className="field-textarea nodrag" rows={2} value={data.description ?? ''}
            onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            placeholder="Optional..." />
        </div>

        <div className="inspector-footer">
          <button className="btn-delete" onClick={() => removeNode(node.id)}>Löschen</button>
        </div>
      </div>
    )
  }

  // ── Normal node inspector ────────────────────────────
  const racks = nodes.filter((n) => n.data.nodeType === 'rack')
  const isContainer = data.nodeType === 'zone'

  return (
    <div className="inspector">
      <div className="inspector-header" style={{ borderLeftColor: color }}>
        <span className="inspector-icon">{icon}</span>
        <span className="inspector-type">{typeName}</span>
      </div>

      <div className="inspector-field">
        <label className="field-label">Name</label>
        <input className="field-input nodrag" value={data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })} />
      </div>

      {!isContainer && (
        <div className="inspector-field">
          <label className="field-label">Größe</label>
          <div className="size-switcher">
            {([['M', {}], ['L', { width: 220 }], ['XL', { width: 300 }]] as const).map(([label, style]) => {
              const w = (node.style as React.CSSProperties | undefined)?.width
              const active = label === 'M' ? !w || w === 130 : label === 'L' ? w === 220 : w === 300
              return (
                <button key={label} className={`side-btn ${active ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeStyle(node.id, style)}>{label}</button>
              )
            })}
          </div>
        </div>
      )}

      {data.nodeType === 'custom' && (
        <div className="inspector-field">
          <label className="field-label">Farbe</label>
          <ColorInput
            value={data.customColor ?? '#6366f1'}
            onChange={(c) => updateNodeData(node.id, { customColor: c })}
          />
        </div>
      )}

      {!isContainer && data.nodeType !== 'custom' && (
        <div className="inspector-field">
          <label className="field-label">Port-Seite</label>
          <div className="port-side-switcher">
            <button className={`side-btn ${(data.portSide ?? 'right') === 'left' ? 'side-btn-active' : ''}`}
              onClick={() => updateNodeData(node.id, { portSide: 'left' })}>◀ Links</button>
            <button className={`side-btn ${(data.portSide ?? 'right') === 'right' ? 'side-btn-active' : ''}`}
              onClick={() => updateNodeData(node.id, { portSide: 'right' })}>Rechts ▶</button>
          </div>
        </div>
      )}

      <div className="inspector-field">
        <label className="field-label">Beschreibung</label>
        <textarea className="field-textarea nodrag" rows={2} value={data.description ?? ''}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          placeholder="Optional..." />
      </div>

      {!isContainer && (
        <>
          {data.nodeType === 'custom' && (
            <div className="inspector-field">
              <label className="field-label">Port-Seite</label>
              <div className="port-side-switcher">
                <button className={`side-btn ${(data.portSide ?? 'right') === 'left' ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeData(node.id, { portSide: 'left' })}>◀ Links</button>
                <button className={`side-btn ${(data.portSide ?? 'right') === 'right' ? 'side-btn-active' : ''}`}
                  onClick={() => updateNodeData(node.id, { portSide: 'right' })}>Rechts ▶</button>
              </div>
            </div>
          )}
          <PortEditor nodeId={node.id} ports={data.ports} />
        </>
      )}

      {/* ── Rack assignment ─────────────────────────── */}
      {racks.length > 0 && !isContainer && (
        <RackAssignment nodeId={node.id} nodeType={data.nodeType} racks={racks} />
      )}

      <div className="inspector-footer">
        <button className="btn-duplicate" onClick={() => duplicateNode(node.id)}>Duplizieren</button>
        <button className="btn-delete" onClick={() => removeNode(node.id)}>Löschen</button>
      </div>
    </div>
  )
}

// ── Rack assignment sub-component ───────────────────────
interface RackAssignmentProps {
  nodeId: string
  nodeType: string
  racks: ReturnType<typeof useDiagramStore.getState>['nodes']
}

function RackAssignment({ nodeId, nodeType, racks }: RackAssignmentProps) {
  const addToRack = useDiagramStore((s) => s.addToRack)
  const removeFromRack = useDiagramStore((s) => s.removeFromRack)
  const updateRackSlot = useDiagramStore((s) => s.updateRackSlot)

  const defaultSpan = DEFAULT_RACK_COLSPAN[nodeType as keyof typeof DEFAULT_RACK_COLSPAN] ?? 2
  const [targetRackId, setTargetRackId] = useState(racks[0]?.id ?? '')
  const [uRow, setURow] = useState(1)
  const [colSpan, setColSpan] = useState(defaultSpan)

  // Find all racks this node is in
  const assignments = racks.flatMap((rack) => {
    const slot = (rack.data.rackSlots ?? []).find((s) => s.nodeId === nodeId)
    return slot ? [{ rack, slot }] : []
  })

  return (
    <div className="inspector-field">
      <label className="field-label">Rack-Platzierung</label>

      {/* Existing assignments */}
      {assignments.map(({ rack, slot }) => (
        <div key={rack.id} className="rack-assignment-row">
          <span className="rack-assignment-name">{rack.data.label}</span>
          <span className="rack-u-badge">U{slot.uRow}</span>
          <input
            type="number" min={1} max={5}
            className="rack-span-input nodrag"
            value={slot.colSpan}
            title="Spalten (1–5)"
            onChange={(e) => updateRackSlot(rack.id, nodeId, { colSpan: Math.max(1, Math.min(5, Number(e.target.value))) })}
          />
          <button className="btn-small btn-remove" onClick={() => removeFromRack(rack.id, nodeId)}>✕</button>
        </div>
      ))}

      {/* Add to rack form */}
      <div className="rack-add-form">
        <select
          className="rack-select nodrag"
          value={targetRackId}
          onChange={(e) => setTargetRackId(e.target.value)}
        >
          {racks.map((r) => (
            <option key={r.id} value={r.id}>{r.data.label}</option>
          ))}
        </select>
        <label className="rack-add-label">U</label>
        <input
          type="number" min={1} max={48}
          className="rack-u-input nodrag"
          value={uRow}
          onChange={(e) => setURow(Math.max(1, Number(e.target.value)))}
        />
        <label className="rack-add-label">Sp</label>
        <input
          type="number" min={1} max={5}
          className="rack-span-input nodrag"
          value={colSpan}
          onChange={(e) => setColSpan(Math.max(1, Math.min(5, Number(e.target.value))))}
        />
        <button
          className="btn-small btn-add"
          onClick={() => addToRack(targetRackId, nodeId, uRow, colSpan)}
        >+ Rack</button>
      </div>
    </div>
  )
}

// ── Reusable color input with hex text field ─────────────
interface ColorInputProps {
  value: string
  onChange: (color: string) => void
  onReset?: () => void
}

function ColorInput({ value, onChange, onReset }: ColorInputProps) {
  const [hex, setHex] = useState(value)
  // Sync external value changes into local state
  React.useEffect(() => { setHex(value) }, [value])

  function handleHexChange(raw: string) {
    setHex(raw)
    const clean = raw.startsWith('#') ? raw : '#' + raw
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) onChange(clean)
  }

  return (
    <div className="color-picker-row">
      <input
        type="color"
        className="color-input nodrag"
        value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'}
        onChange={(e) => { setHex(e.target.value); onChange(e.target.value) }}
      />
      <input
        className="color-hex-input nodrag"
        value={hex}
        maxLength={7}
        placeholder="#rrggbb"
        onChange={(e) => handleHexChange(e.target.value)}
        spellCheck={false}
      />
      {onReset && (
        <button className="btn-small btn-remove" onClick={onReset} title="Standardfarbe">↺</button>
      )}
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
          <input className="field-input nodrag" value={info[key]} placeholder={label}
            onChange={(e) => update({ [key]: e.target.value })} />
        </div>
      ))}
      <div className="inspector-field">
        <label className="field-label">Beschreibung</label>
        <textarea className="field-textarea nodrag" rows={3} value={info.description}
          placeholder="Beschreibung…"
          onChange={(e) => update({ description: e.target.value })} />
      </div>
      <p className="inspector-hint">Klicke auf ein Element oder eine Verbindung um es zu bearbeiten.</p>
    </div>
  )
}
