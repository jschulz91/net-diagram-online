import { memo, useCallback, useRef } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  Position,
  type EdgeProps,
} from 'reactflow'
import type { ConnectionData } from '../../types/diagram'
import { useDiagramStore } from '../../store/diagramStore'

const ELBOW = 40  // px stub before the first turn

function buildManualPath(
  sourceX: number, sourceY: number, sourcePosition: Position,
  targetX: number, targetY: number, targetPosition: Position,
  offsetX: number, offsetY: number
): { d: string; lx: number; ly: number } {

  // ── Same-direction (LL or RR): 3-segment L-path ─────────
  if (sourcePosition === targetPosition) {
    let elbowX: number
    if (sourcePosition === Position.Left) {
      // Both exit left → elbow to the LEFT of both nodes
      elbowX = Math.min(sourceX, targetX) - ELBOW + offsetX
    } else {
      // Both exit right → elbow to the RIGHT of both nodes
      elbowX = Math.max(sourceX, targetX) + ELBOW + offsetX
    }
    const d = `M ${sourceX},${sourceY} H ${elbowX} V ${targetY} H ${targetX}`
    // Handle sits on the vertical segment, centered between the two Y values
    return { d, lx: elbowX, ly: (sourceY + targetY) / 2 + offsetY }
  }

  // ── Facing-away (LR or RL): 5-segment U-path ────────────
  // Source exits away from target, requiring a loop around both nodes
  const midY = (sourceY + targetY) / 2 + offsetY
  let elbowSrc: number
  let elbowTgt: number

  if (sourcePosition === Position.Left) {
    // Source exits LEFT, target enters from RIGHT
    elbowSrc = sourceX - ELBOW + offsetX
    elbowTgt = targetX + ELBOW - offsetX
  } else {
    // Source exits RIGHT, target enters from LEFT
    elbowSrc = sourceX + ELBOW + offsetX
    elbowTgt = targetX - ELBOW - offsetX
  }

  const d = [
    `M ${sourceX},${sourceY}`,
    `H ${elbowSrc}`,
    `V ${midY}`,
    `H ${elbowTgt}`,
    `V ${targetY}`,
    `H ${targetX}`,
  ].join(' ')

  // Handle at the center of the horizontal middle segment
  return { d, lx: (elbowSrc + elbowTgt) / 2, ly: midY }
}

function AdjustableStepEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data, selected,
  style, label, labelStyle, labelBgStyle, labelBgPadding, labelBgBorderRadius,
  markerEnd, markerStart,
}: EdgeProps<ConnectionData>) {
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData)
  const { getZoom } = useReactFlow()

  const routingOffsetX = data?.routingOffset ?? 0
  const routingOffsetY = data?.routingOffsetY ?? 0

  // getSmoothStepPath works well only for the standard Right→Left case.
  // For same-direction (LL, RR) and facing-away (LR, RL), use manual paths.
  const sp = sourcePosition ?? Position.Right
  const tp = targetPosition ?? Position.Left
  const needsManualPath =
    sp === tp ||  // Left→Left or Right→Right
    (sp === Position.Left && tp === Position.Right) ||   // facing away
    (sp === Position.Right && tp === Position.Left && false)  // Right→Left is normal, keep getSmoothStepPath

  let edgePath: string
  let labelX: number
  let labelY: number

  if (needsManualPath) {
    const { d, lx, ly } = buildManualPath(
      sourceX, sourceY, sp,
      targetX, targetY, tp,
      routingOffsetX, routingOffsetY
    )
    edgePath = d
    labelX = lx
    labelY = ly
  } else {
    const centerX = (sourceX + targetX) / 2 + routingOffsetX
    const centerY = (sourceY + targetY) / 2 + routingOffsetY
    ;[edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition: sp,
      targetX, targetY, targetPosition: tp,
      borderRadius: 0,
      centerX,
      centerY,
    })
  }

  const dragRef = useRef<{
    startX: number; startY: number
    startOffsetX: number; startOffsetY: number
  } | null>(null)

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: routingOffsetX,
        startOffsetY: routingOffsetY,
      }

      const onMove = (me: MouseEvent) => {
        if (!dragRef.current) return
        const zoom = getZoom()
        const dx = (me.clientX - dragRef.current.startX) / zoom
        const dy = (me.clientY - dragRef.current.startY) / zoom
        updateEdgeData(id, {
          routingOffset: dragRef.current.startOffsetX + dx,
          routingOffsetY: dragRef.current.startOffsetY + dy,
        })
      }
      const onUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [id, routingOffsetX, routingOffsetY, updateEdgeData, getZoom]
  )

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={data?.dashed ? { ...style, strokeDasharray: '7 4' } : style}
        label={label}
        labelX={labelX}
        labelY={labelY}
        labelStyle={labelStyle}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="edge-routing-handle nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
              cursor: 'move',
            }}
            onMouseDown={onHandleMouseDown}
            title="Kante verschieben"
          />
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(AdjustableStepEdge)
