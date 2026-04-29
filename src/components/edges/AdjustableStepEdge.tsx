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

  const routingOffset = data?.routingOffset ?? 0
  const centerX = (sourceX + targetX) / 2 + routingOffset

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
    centerX,
  })

  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null)

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startOffset: routingOffset }

      const onMove = (me: MouseEvent) => {
        if (!dragRef.current) return
        const delta = (me.clientX - dragRef.current.startX) / getZoom()
        updateEdgeData(id, { routingOffset: dragRef.current.startOffset + delta })
      }
      const onUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [id, routingOffset, updateEdgeData, getZoom]
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
              transform: `translate(-50%, -50%) translate(${centerX}px,${(sourceY + targetY) / 2}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            onMouseDown={onHandleMouseDown}
            title="Kante verschieben (ziehen)"
          />
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(AdjustableStepEdge)
