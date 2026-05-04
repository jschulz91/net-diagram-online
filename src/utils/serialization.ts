import type { Edge } from 'reactflow'
import LZString from 'lz-string'
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
      rackUnits: n.data.rackUnits,
      hideCables: n.data.hideCables,
      rackSlots: n.data.rackSlots,
      ports: n.data.ports.map((p) => ({ id: p.id, type: p.type, name: p.name })),
      position: { x: n.position.x, y: n.position.y },
      style: n.style as Record<string, unknown> | undefined,
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
      routingOffsetY: e.data?.routingOffsetY,
      color: e.data?.color,
      dashed: e.data?.dashed,
    })),
  }
}

const VALID_NODE_TYPES: NodeType[] = ['server', 'switch', 'vpn_router', 'firewall', 'plc', 'zone', 'rack', 'custom']

export function fromJSON(raw: unknown): { nodes: NetworkNode[]; edges: NetworkEdge[]; projectInfo?: ProjectInfo } {
  if (!raw || typeof raw !== 'object') throw new Error('Ungültiges JSON-Format')
  const file = raw as Record<string, unknown>

  if (file.version !== '1.0') throw new Error(`Unbekannte Version: ${String(file.version)}`)
  if (!Array.isArray(file.nodes)) throw new Error('"nodes" muss ein Array sein')
  if (!Array.isArray(file.edges)) throw new Error('"edges" muss ein Array sein')

  const unsortedNodes: NetworkNode[] = file.nodes.map((raw: unknown, i: number) => {
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

    const nodeType = n.nodeType as NodeType
    const isContainer = nodeType === 'zone' || nodeType === 'rack'

    const data: NetworkNodeData = {
      label: n.label as string,
      nodeType,
      description: typeof n.description === 'string' ? n.description : undefined,
      portSide: isContainer ? undefined : (n.portSide === 'left' ? 'left' : 'right'),
      customColor: typeof n.customColor === 'string' ? n.customColor : undefined,
      rackUnits: typeof n.rackUnits === 'number' ? n.rackUnits : (nodeType === 'rack' ? 12 : undefined),
      hideCables: n.hideCables === true ? true : undefined,
      rackSlots: Array.isArray(n.rackSlots)
        ? (n.rackSlots as unknown[]).map((s: unknown) => {
            const slot = s as Record<string, unknown>
            return {
              nodeId: String(slot.nodeId ?? ''),
              uRow: Number(slot.uRow ?? 1),
              colStart: Number(slot.colStart ?? 1),
              colSpan: Number(slot.colSpan ?? 1),
            }
          })
        : (nodeType === 'rack' ? [] : undefined),
      ports: (n.ports as unknown[]).map((p: unknown, pi: number) => {
        if (!p || typeof p !== 'object') throw new Error(`Knoten ${i}, Port ${pi}: ungültig`)
        const port = p as Record<string, unknown>
        if (typeof port.id !== 'string' || typeof port.type !== 'string' || typeof port.name !== 'string')
          throw new Error(`Knoten ${i}, Port ${pi}: fehlende Felder`)
        return { id: port.id as string, type: port.type as string, name: port.name as string }
      }),
    }

    const defaultStyle = nodeType === 'rack'
      ? { width: 180, height: 420 }
      : nodeType === 'zone'
      ? { width: 280, height: 200 }
      : undefined

    return {
      id: n.id as string,
      type: nodeType as string,
      position: { x: pos.x as number, y: pos.y as number },
      zIndex: typeof n.zIndex === 'number' ? n.zIndex : (isContainer ? -1 : 0),
      style: (n.style as Record<string, unknown> | undefined) ?? defaultStyle,
      data,
    }
  })

  // No parentNode relationships — order doesn't matter, but zones/racks first looks cleaner
  const nodes = [
    ...unsortedNodes.filter((n) => n.data.nodeType === 'rack' || n.data.nodeType === 'zone'),
    ...unsortedNodes.filter((n) => n.data.nodeType !== 'rack' && n.data.nodeType !== 'zone'),
  ]

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
    const edgeColor = typeof e.color === 'string' && e.color ? e.color : undefined
    const strokeColor = edgeColor ?? '#64748b'

    const edge: Edge<ConnectionData> = {
      id: e.id as string,
      source: e.sourceNodeId as string,
      target: e.targetNodeId as string,
      sourceHandle: e.sourcePortId as string,
      targetHandle: e.targetPortId as string,
      type: 'adjustable-step',
      label: edgeLabel,
      style: { strokeWidth: 2, stroke: strokeColor },
      labelStyle: { fontSize: 11, fontWeight: 600, fill: '#334155' },
      labelBgStyle: { fill: '#f8fafc', stroke: '#e2e8f0' },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
      data: {
        sourcePortId: e.sourcePortId as string,
        targetPortId: e.targetPortId as string,
        label: edgeLabel,
        routingOffset: typeof e.routingOffset === 'number' ? e.routingOffset : undefined,
        routingOffsetY: typeof e.routingOffsetY === 'number' ? e.routingOffsetY : undefined,
        color: edgeColor,
        dashed: e.dashed === true ? true : undefined,
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

// ── Shareable URL helpers ────────────────────────────────

const HASH_PREFIX = 'd='

export function encodeToUrl(diagram: DiagramFile): string {
  const json = JSON.stringify(diagram)
  const compressed = LZString.compressToEncodedURIComponent(json)
  const base = window.location.href.split('#')[0]
  return `${base}#${HASH_PREFIX}${compressed}`
}

export function decodeFromHash(hash: string): ReturnType<typeof fromJSON> | null {
  if (!hash.startsWith('#' + HASH_PREFIX)) return null
  const compressed = hash.slice(1 + HASH_PREFIX.length)
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    return fromJSON(JSON.parse(json))
  } catch {
    return null
  }
}
