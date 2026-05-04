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

// How far the elbow extends beyond the port in the "facing away" case
const ELBOW_BASE = 40

function buildFacingAwayPath(
  sourceX: number, sourceY: number, sourcePosition: Position,
  targetX: number, targetY: number,
  offsetX: number, offsetY: number
): { d: string; lx: number; ly: number } {
  // 5-segment symmetric orthogonal path:
  //   source → left/right elbow → mid-Y → opposite elbow → target
  const midY = (sourceY + targetY) / 2 + offsetY
  let elbowSrc: number
  let elbowTgt: number

  if (sourcePosition === Position.Left) {
    // Source exits LEFT → elbow to the left; target enters from RIGHT → elbow to the right
    elbowSrc = sourceX - ELBOW_BASE + offsetX
    elbowTgt = targetX + ELBOW_BASE - offsetX
  } else {
    // Source exits RIGHT → elbow to the right; target enters from LEFT → elbow to the left
    elbowSrc = sourceX + ELBOW_BASE + offsetX
    elbowTgt = targetX - ELBOW_BASE - offsetX
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
  const lx = (elbowSrc + elbowTgt) / 2
  const ly = midY

  return { d, lx, ly }
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

  // Detect facing-away configurations where getSmoothStepPath's centerX breaks
  const isFacingAway =
    (sourcePosition === Position.Left && targetPosition === Position.Right) ||
    (sourcePosition === Position.Right && targetPosition === Position.Left)

  let edgePath: string
  let labelX: number
  let labelY: number

  if (isFacingAway) {
    const { d, lx, ly } = buildFacingAwayPath(
      sourceX, sourceY, sourcePosition,
      targetX, targetY,
      routingOffsetX, routingOffsetY
    )
    edgePath = d
    labelX = lx
    labelY = ly
  } else {
    const centerX = (sourceX + targetX) / 2 + routingOffsetX
    const centerY = (sourceY + targetY) / 2 + routingOffsetY
    ;[edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
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
