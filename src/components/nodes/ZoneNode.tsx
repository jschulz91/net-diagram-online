import { NodeResizer } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { NetworkNodeData } from '../../types/diagram'
import { useDiagramStore } from '../../store/diagramStore'

export function ZoneNode({ id, data, selected }: NodeProps<NetworkNodeData>) {
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode)

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        lineStyle={{ stroke: '#94a3b8', strokeWidth: 1 }}
        handleStyle={{ width: 8, height: 8, background: '#94a3b8', border: 'none', borderRadius: 2 }}
      />
      <div
        className={`zone-node ${selected ? 'zone-node-selected' : ''}`}
        onClick={() => setSelectedNode(id)}
      >
        <span className="zone-label nodrag">{data.label}</span>
      </div>
    </>
  )
}
