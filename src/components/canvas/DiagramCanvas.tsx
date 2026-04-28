import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type EdgeTypes,
} from 'reactflow'
import { v4 as uuid } from 'uuid'
import 'reactflow/dist/style.css'

import { useDiagramStore } from '../../store/diagramStore'
import type { ConnectionData } from '../../types/diagram'
import { ServerNode } from '../nodes/ServerNode'
import { SwitchNode } from '../nodes/SwitchNode'
import { VpnRouterNode } from '../nodes/VpnRouterNode'
import { FirewallNode } from '../nodes/FirewallNode'
import { PlcNode } from '../nodes/PlcNode'
import { ZoneNode } from '../nodes/ZoneNode'
import { CustomNode } from '../nodes/CustomNode'
import AdjustableStepEdge from '../edges/AdjustableStepEdge'
import { TitleBlock } from './TitleBlock'

const nodeTypes = {
  server: ServerNode,
  switch: SwitchNode,
  vpn_router: VpnRouterNode,
  firewall: FirewallNode,
  plc: PlcNode,
  zone: ZoneNode,
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  'adjustable-step': AdjustableStepEdge,
}

const defaultEdgeOptions = {
  type: 'adjustable-step',
  style: { strokeWidth: 2, stroke: '#64748b' },
  labelStyle: { fontSize: 11, fontWeight: 600, fill: '#334155' },
  labelBgStyle: { fill: '#f8fafc', stroke: '#e2e8f0' },
  labelBgPadding: [4, 6] as [number, number],
  labelBgBorderRadius: 4,
}

export function DiagramCanvas() {
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const onNodesChange = useDiagramStore((s) => s.onNodesChange)
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange)
  const addEdge = useDiagramStore((s) => s.addEdge)
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode)
  const setSelectedEdge = useDiagramStore((s) => s.setSelectedEdge)
  const projectInfo = useDiagramStore((s) => s.projectInfo)

  const frozenNodeTypes = useMemo(() => nodeTypes, [])
  const frozenEdgeTypes = useMemo(() => edgeTypes, [])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return
      const edge: Edge<ConnectionData> = {
        id: uuid(),
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'adjustable-step',
        style: defaultEdgeOptions.style,
        labelStyle: defaultEdgeOptions.labelStyle,
        labelBgStyle: defaultEdgeOptions.labelBgStyle,
        labelBgPadding: defaultEdgeOptions.labelBgPadding,
        labelBgBorderRadius: defaultEdgeOptions.labelBgBorderRadius,
        data: {
          sourcePortId: params.sourceHandle,
          targetPortId: params.targetHandle,
        },
      }
      addEdge(edge)
    },
    [addEdge]
  )

  const isValidConnection = useCallback(
    (connection: Connection) => connection.source !== connection.target,
    []
  )

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => setSelectedEdge(edge.id),
    [setSelectedEdge]
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        isValidConnection={isValidConnection}
        nodeTypes={frozenNodeTypes}
        edgeTypes={frozenEdgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={defaultEdgeOptions}
        onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null) }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
      >
        <Background gap={16} />
        <Controls className="no-print" />
        <MiniMap
          className="no-print"
          position="top-right"
          nodeColor={(n) => {
            const colors: Record<string, string> = {
              server: '#3b82f6',
              switch: '#10b981',
              vpn_router: '#8b5cf6',
              firewall: '#ef4444',
              plc: '#f59e0b',
            }
            return colors[n.type ?? ''] ?? '#94a3b8'
          }}
        />
        <Panel position="bottom-right">
          <TitleBlock info={projectInfo} />
        </Panel>
      </ReactFlow>
    </div>
  )
}
