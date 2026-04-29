import { NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { NetworkNodeData, RackSlot } from '../../types/diagram'
import { useDiagramStore } from '../../store/diagramStore'
import { NODE_COLORS, NODE_ICONS } from '../../constants/nodeDefinitions'

const RACK_COLS = 5

export function RackNode({ id, data, selected }: NodeProps<NetworkNodeData>) {
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode)
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)

  const rackUnits = data.rackUnits ?? 12
  const slots = data.rackSlots ?? []

  const slotByNodeId = new Map(slots.map((s) => [s.nodeId, s]))

  // Only show cables when hideCables is NOT true
  const intraEdges = data.hideCables
    ? []
    : edges.filter((e) => slotByNodeId.has(e.source) && slotByNodeId.has(e.target))

  // Assign each cable a unique lane index so they don't overlap
  const cableLanes = new Map<string, number>()
  intraEdges.forEach((e, i) => cableLanes.set(e.id, i))

  const slotsByRow = new Map<number, RackSlot[]>()
  slots.forEach((s) => {
    const row = slotsByRow.get(s.uRow) ?? []
    row.push(s)
    slotsByRow.set(s.uRow, row)
  })

  // Cable channel SVG path:
  // Each cable exits the right side of its source row → goes right to its lane
  // → drops vertically → enters target row from the right
  // ViewBox: x = 0..1 (full channel width), y = 0..rackUnits (one unit per row)
  // Lane x positions: spread from 0.1 to 0.9, one per cable
  const totalCables = intraEdges.length
  function laneX(index: number) {
    if (totalCables === 1) return 0.5
    return 0.1 + (index / (totalCables - 1)) * 0.8
  }

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={rackUnits * 28 + 40}
        lineStyle={{ stroke: '#3b82f6', strokeWidth: 1 }}
        handleStyle={{ width: 7, height: 7, background: '#3b82f6', border: 'none', borderRadius: 2 }}
      />
      <div
        className={`rack-node${selected ? ' rack-node-selected' : ''}`}
        onClick={() => setSelectedNode(id)}
      >
        {/* Header */}
        <div className="rack-header">
          <span className="rack-label nodrag">{data.label}</span>
          <span className="rack-units-badge">{rackUnits}U</span>
        </div>

        {/* Body: rows area + cable channel */}
        <div className="rack-body">
          {/* Left: U-rows with slot grid */}
          <div className="rack-rows">
            {Array.from({ length: rackUnits }).map((_, rowIdx) => {
              const uRow = rowIdx + 1
              const rowSlots = slotsByRow.get(uRow) ?? []
              const occupied = new Set<number>()
              rowSlots.forEach((s) => {
                for (let c = s.colStart; c < s.colStart + s.colSpan; c++) occupied.add(c)
              })

              return (
                <div key={uRow} className="rack-row">
                  <div className="rack-u-num">{uRow}</div>
                  <div className="rack-row-grid">
                    {rowSlots.map((slot) => {
                      const refNode = nodes.find((n) => n.id === slot.nodeId)
                      const nodeType = refNode?.data.nodeType
                      const color = nodeType ? (NODE_COLORS[nodeType] ?? '#64748b') : '#64748b'
                      const icon = nodeType ? (NODE_ICONS[nodeType] ?? '') : ''
                      const label = refNode?.data.label ?? '?'
                      return (
                        <div
                          key={slot.nodeId}
                          className="rack-slot-item"
                          style={{ gridColumn: `${slot.colStart} / span ${slot.colSpan}`, background: color }}
                          title={`${label} (U${uRow})`}
                        >
                          <span className="rack-slot-icon">{icon}</span>
                          {slot.colSpan >= 2 && (
                            <span className="rack-slot-label">{label}</span>
                          )}
                        </div>
                      )
                    })}
                    {Array.from({ length: RACK_COLS }).map((_, colIdx) => {
                      const col = colIdx + 1
                      if (occupied.has(col)) return null
                      return <div key={col} className="rack-empty-cell" style={{ gridColumn: col }} />
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: cable channel */}
          <div className="rack-cable-channel">
            {intraEdges.length > 0 && (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 1 ${rackUnits}`}
                preserveAspectRatio="none"
              >
                {intraEdges.map((edge) => {
                  const srcSlot = slotByNodeId.get(edge.source)
                  const tgtSlot = slotByNodeId.get(edge.target)
                  if (!srcSlot || !tgtSlot) return null
                  if (srcSlot.uRow === tgtSlot.uRow) return null

                  const srcY = srcSlot.uRow - 0.5  // center of source row
                  const tgtY = tgtSlot.uRow - 0.5  // center of target row
                  const x = laneX(cableLanes.get(edge.id) ?? 0)
                  const color = edge.data?.color ?? '#94a3b8'
                  const dashed = edge.data?.dashed

                  // Path: enter channel from left at srcY → go to lane x → drop to tgtY → exit left
                  const d = `M 0,${srcY} H ${x} V ${tgtY} H 0`

                  return (
                    <path
                      key={edge.id}
                      d={d}
                      stroke={color}
                      strokeWidth={0.08}
                      strokeDasharray={dashed ? '0.18 0.1' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.9}
                    />
                  )
                })}
              </svg>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
