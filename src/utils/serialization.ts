import type { Edge } from 'reactflow'
import type {
  NetworkNode,
  NetworkEdge,
  NetworkNodeData,
  ConnectionData,
  DiagramFile,
  NodeType,
  ProjectInfo,
} from '../types/diagram'

export function toJSON(nodes: NetworkNode[], edges: NetworkEdge[], projectInfo?: ProjectInfo): DiagramFile {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projectInfo,
    nodes: nodes.map((n) => ({
      id: n.id,
      nodeType: n.data.nodeType,
      label: n.data.label,
      description: n.data.description,
      portSide: n.data.portSide,
      customColor: n.data.customColor,
      ports: n.data.ports.map((p) => ({ id: p.id, type: p.type, name: p.name })),
      position: { x: n.position.x, y: n.position.y },
      style: n.style,
      zIndex: n.zIndex,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source,
      sourcePortId: e.data?.sourcePortId ?? e.sourceHandle ?? '',
      targetNodeId: e.target,
      targetPortId: e.data?.targetPortId ?? e.targetHandle ?? '',
      label: typeof e.label === 'string' ? e.label : (e.data?.label ?? undefined),
      routingOffset: e.data?.routingOffset,
    })),
  }
}

const VALID_NODE_TYPES: NodeType[] = ['server', 'switch', 'vpn_router', 'firewall', 'plc', 'zone', 'custom']

export function fromJSON(raw: unknown): { nodes: NetworkNode[]; edges: NetworkEdge[]; projectInfo?: ProjectInfo } {
  if (!raw || typeof raw !== 'object') throw new Error('Ungültiges JSON-Format')
  const file = raw as Record<string, unknown>

  if (file.version !== '1.0') throw new Error(`Unbekannte Version: ${String(file.version)}`)
  if (!Array.isArray(file.nodes)) throw new Error('"nodes" muss ein Array sein')
  if (!Array.isArray(file.edges)) throw new Error('"edges" muss ein Array sein')

  const nodes: NetworkNode[] = file.nodes.map((raw: unknown, i: number) => {
    if (!raw || typeof raw !== 'object') throw new Error(`Knoten ${i}: ungültiges Format`)
    const n = raw as Record<string, unknown>
    if (typeof n.id !== 'string') throw new Error(`Knoten ${i}: fehlende id`)
    if (!VALID_NODE_TYPES.includes(n.nodeType as NodeType))
      throw new Error(`Knoten ${i}: unbekannter Typ "${String(n.nodeType)}"`)
    if (typeof n.label !== 'string') throw new Error(`Knoten ${i}: fehlender label`)
    if (!Array.isArray(n.ports)) throw new Error(`Knoten ${i}: ports muss Array sein`)
    const pos = n.position as Record<string, unknown>
    if (typeof pos?.x !== 'number' || typeof pos?.y !== 'number')
      throw new Error(`Knoten ${i}: ungültige position`)

    const data: NetworkNodeData = {
      label: n.label as string,
      nodeType: n.nodeType as NodeType,
      description: typeof n.description === 'string' ? n.description : undefined,
      portSide: n.portSide === 'left' ? 'left' : 'right',
      customColor: typeof n.customColor === 'string' ? n.customColor : undefined,
      ports: (n.ports as unknown[]).map((p: unknown, pi: number) => {
        if (!p || typeof p !== 'object') throw new Error(`Knoten ${i}, Port ${pi}: ungültig`)
        const port = p as Record<string, unknown>
        if (typeof port.id !== 'string' || typeof port.type !== 'string' || typeof port.name !== 'string')
          throw new Error(`Knoten ${i}, Port ${pi}: fehlende Felder`)
        return { id: port.id as string, type: port.type as string, name: port.name as string }
      }),
    }

    const isZone = (n.nodeType as string) === 'zone'
    return {
      id: n.id as string,
      type: n.nodeType as string,
      position: { x: pos.x as number, y: pos.y as number },
      zIndex: typeof n.zIndex === 'number' ? n.zIndex : (isZone ? -1 : 0),
      style: n.style as Record<string, unknown> | undefined ?? (isZone ? { width: 280, height: 200 } : undefined),
      data,
    }
  })

  const edges: NetworkEdge[] = file.edges.map((raw: unknown, i: number) => {
    if (!raw || typeof raw !== 'object') throw new Error(`Kante ${i}: ungültiges Format`)
    const e = raw as Record<string, unknown>
    if (
      typeof e.id !== 'string' ||
      typeof e.sourceNodeId !== 'string' ||
      typeof e.sourcePortId !== 'string' ||
      typeof e.targetNodeId !== 'string' ||
      typeof e.targetPortId !== 'string'
    )
      throw new Error(`Kante ${i}: fehlende Felder`)

    const edgeLabel = typeof e.label === 'string' && e.label ? e.label : undefined
    const edge: Edge<ConnectionData> = {
      id: e.id as string,
      source: e.sourceNodeId as string,
      target: e.targetNodeId as string,
      sourceHandle: e.sourcePortId as string,
      targetHandle: e.targetPortId as string,
      type: 'adjustable-step',
      label: edgeLabel,
      style: { strokeWidth: 2, stroke: '#64748b' },
      labelStyle: { fontSize: 11, fontWeight: 600, fill: '#334155' },
      labelBgStyle: { fill: '#f8fafc', stroke: '#e2e8f0' },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
      data: {
        sourcePortId: e.sourcePortId as string,
        targetPortId: e.targetPortId as string,
        label: edgeLabel,
        routingOffset: typeof e.routingOffset === 'number' ? e.routingOffset : undefined,
      },
    }
    return edge as NetworkEdge
  })

  let projectInfo: ProjectInfo | undefined
  if (file.projectInfo && typeof file.projectInfo === 'object') {
    const p = file.projectInfo as Record<string, unknown>
    projectInfo = {
      name: typeof p.name === 'string' ? p.name : '',
      creator: typeof p.creator === 'string' ? p.creator : '',
      date: typeof p.date === 'string' ? p.date : '',
      version: typeof p.version === 'string' ? p.version : '',
      description: typeof p.description === 'string' ? p.description : '',
    }
  }

  return { nodes, edges, projectInfo }
}
