import { memo, useCallback, useRef } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow'
import type { ConnectionData } from '../../types/diagram'
import { useDiagramStore } from '../../store/diagramStore'

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

  const centerX = (sourceX + targetX) / 2 + routingOffsetX
  const centerY = (sourceY + targetY) / 2 + routingOffsetY

  // labelX/labelY is the actual geometric center of the rendered path —
  // always correct regardless of sourcePosition/targetPosition direction
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
    centerX,
    centerY,
  })

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
              // Place handle at the actual path center, works for any port direction
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
              cursor: 'move',
            }}
            onMouseDown={onHandleMouseDown}
            title="Kante verschieben (horizontal + vertikal ziehen)"
          />
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(AdjustableStepEdge)
