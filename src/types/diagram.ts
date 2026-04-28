import type { Node, Edge } from 'reactflow'

export interface ProjectInfo {
  name: string
  creator: string
  date: string
  version: string
  description: string
}

export type NodeType = 'server' | 'switch' | 'vpn_router' | 'firewall' | 'plc' | 'zone' | 'custom'

export interface Port {
  id: string
  type: string  // e.g. "eth", "fiber", "serial"
  name: string  // e.g. "X1", "eth0", "GE1"
}

export interface NetworkNodeData {
  label: string
  nodeType: NodeType
  ports: Port[]
  description?: string
  portSide?: 'left' | 'right'   // which side handles appear on (default: right)
  customColor?: string           // only used by 'custom' node type
}

export interface ConnectionData {
  sourcePortId: string
  targetPortId: string
  label?: string
  routingOffset?: number  // horizontal offset for the vertical segment of step edges
}

export type NetworkNode = Node<NetworkNodeData>
export type NetworkEdge = Edge<ConnectionData>

// --- JSON Export/Import Format ---

export interface SerializedPort {
  id: string
  type: string
  name: string
}

export interface SerializedNode {
  id: string
  nodeType: NodeType
  label: string
  description?: string
  ports: SerializedPort[]
  position: { x: number; y: number }
}

export interface SerializedEdge {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  label?: string
}

export interface DiagramFile {
  version: '1.0'
  exportedAt: string
  projectInfo?: ProjectInfo
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}
