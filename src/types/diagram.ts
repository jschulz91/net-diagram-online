import type { Node, Edge } from 'reactflow'

export interface ProjectInfo {
  name: string
  creator: string
  date: string
  version: string
  description: string
}

export type NodeType = 'server' | 'switch' | 'vpn_router' | 'firewall' | 'plc' | 'zone' | 'rack' | 'custom'

export interface Port {
  id: string
  type: string  // e.g. "eth", "fiber", "serial"
  name: string  // e.g. "X1", "eth0", "GE1"
}

export interface RackSlot {
  nodeId: string    // references a node in the diagram
  uRow: number      // 1-based U position
  colStart: number  // 1–5, starting column
  colSpan: number   // 1–5, number of columns spanned
}

export interface NetworkNodeData {
  label: string
  nodeType: NodeType
  ports: Port[]
  description?: string
  portSide?: 'left' | 'right'
  customColor?: string
  rackUnits?: number      // only for 'rack' — number of U rows (default 12)
  hideCables?: boolean    // only for 'rack' — hide edges between racked nodes
  rackSlots?: RackSlot[]  // only for 'rack' — devices mounted in this rack
}

export interface ConnectionData {
  sourcePortId: string
  targetPortId: string
  label?: string
  routingOffset?: number   // horizontal shift of the vertical segment
  routingOffsetY?: number  // vertical shift of the bend point
  color?: string
  dashed?: boolean
}

export type NetworkNode = Node<NetworkNodeData>
export type NetworkEdge = Edge<ConnectionData>

// --- JSON Export/Import Format ---

export interface SerializedPort {
  id: string
  type: string
  name: string
}

export interface SerializedRackSlot {
  nodeId: string
  uRow: number
  colStart: number
  colSpan: number
}

export interface SerializedNode {
  id: string
  nodeType: NodeType
  label: string
  description?: string
  ports: SerializedPort[]
  position: { x: number; y: number }
  style?: Record<string, unknown>
  zIndex?: number
  portSide?: 'left' | 'right'
  customColor?: string
  rackUnits?: number
  hideCables?: boolean
  rackSlots?: SerializedRackSlot[]
}

export interface SerializedEdge {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  label?: string
  routingOffset?: number
  color?: string
  dashed?: boolean
}

export interface DiagramFile {
  version: '1.0'
  exportedAt: string
  projectInfo?: ProjectInfo
  nodes: SerializedNode[]
  edges: SerializedEdge[]
}
