import { useEffect } from 'react'
import { Handle, NodeResizer, Position, useUpdateNodeInternals } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { NetworkNodeData } from '../../types/diagram'
import { useDiagramStore } from '../../store/diagramStore'
import { NODE_LABELS } from '../../constants/nodeDefinitions'

interface BaseNetworkNodeProps extends NodeProps<NetworkNodeData> {
  icon: string
  color: string
}

export function BaseNetworkNode({ id, data, selected, icon, color }: BaseNetworkNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals()
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode)

  const portSide = data.portSide ?? 'right'
  const handlePosition = portSide === 'left' ? Position.Left : Position.Right

  useEffect(() => {
    updateNodeInternals(id)
  }, [data.ports.length, portSide, id, updateNodeInternals])

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={130}
        minHeight={60}
        lineStyle={{ stroke: color, strokeWidth: 1, opacity: 0.5 }}
        handleStyle={{ width: 7, height: 7, background: color, border: 'none', borderRadius: 2 }}
      />
      <div
        className="network-node"
        style={{ borderColor: selected ? color : '#cbd5e1' }}
        onClick={() => setSelectedNode(id)}
      >
        {/* Header: icon + user name (prominent) */}
        <div className="node-header" style={{ background: color }}>
          <span className="node-icon">{icon}</span>
          <span className="node-label-header nodrag">{data.label}</span>
        </div>

        {/* Subheader: type label */}
        <div className="node-type-area">
          <span className="node-type-badge">{NODE_LABELS[data.nodeType]}</span>
        </div>

        {/* Port rows */}
        {data.ports.length > 0 && (
          <div className="port-list">
            {data.ports.map((port) => (
              <div key={port.id} className={`port-row port-row-${portSide}`}>
                <span className="port-name">{port.name}</span>
                <span className="port-type">{port.type}</span>
                <Handle
                  id={port.id}
                  type="source"
                  position={handlePosition}
                  style={{ background: color }}
                  title={`${port.name} (${port.type})`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
