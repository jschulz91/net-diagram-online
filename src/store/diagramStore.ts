import React from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { NodeChange, EdgeChange, Edge } from 'reactflow'
import { v4 as uuid } from 'uuid'
import type { NetworkNode, NetworkEdge, NetworkNodeData, Port, NodeType, ConnectionData, ProjectInfo } from '../types/diagram'
import { DEFAULT_PORTS, NODE_LABELS } from '../constants/nodeDefinitions'

const DEFAULT_PROJECT_INFO: ProjectInfo = {
  name: '', creator: '', date: '', version: '', description: '',
}

interface DiagramState {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  projectInfo: ProjectInfo

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void

  addNode: (type: NodeType) => void
  removeNode: (id: string) => void
  updateNodeData: (id: string, patch: Partial<NetworkNodeData>) => void
  addPort: (nodeId: string, port: Port) => void
  updatePort: (nodeId: string, portId: string, patch: Partial<Omit<Port, 'id'>>) => void
  removePort: (nodeId: string, portId: string) => void
  duplicateNode: (id: string) => void
  addEdge: (edge: Edge<ConnectionData>) => void
  removeEdge: (id: string) => void
  updateEdgeLabel: (id: string, label: string) => void
  updateEdgeData: (id: string, patch: Partial<ConnectionData>) => void
  updateNodeStyle: (id: string, style: React.CSSProperties) => void
  updateProjectInfo: (patch: Partial<ProjectInfo>) => void
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  loadDiagram: (diagram: { nodes: NetworkNode[]; edges: NetworkEdge[]; projectInfo?: ProjectInfo }) => void
}

export const useDiagramStore = create<DiagramState>()(
  immer((set) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedEdgeId: null,
    projectInfo: { ...DEFAULT_PROJECT_INFO },

    onNodesChange: (changes) =>
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes) as NetworkNode[]
        const selectChange = changes.find((c) => c.type === 'select')
        if (selectChange && selectChange.type === 'select') {
          if (selectChange.selected) {
            state.selectedNodeId = selectChange.id
            state.selectedEdgeId = null
          } else if (state.selectedNodeId === selectChange.id) {
            state.selectedNodeId = null
          }
        }
        const removeChange = changes.find((c) => c.type === 'remove')
        if (removeChange && removeChange.type === 'remove') {
          if (state.selectedNodeId === removeChange.id) state.selectedNodeId = null
          state.edges = state.edges.filter(
            (e) => e.source !== removeChange.id && e.target !== removeChange.id
          )
        }
      }),

    onEdgesChange: (changes) =>
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges) as NetworkEdge[]
        const removeChange = changes.find((c) => c.type === 'remove')
        if (removeChange && removeChange.type === 'remove') {
          if (state.selectedEdgeId === removeChange.id) state.selectedEdgeId = null
        }
      }),

    addNode: (type) =>
      set((state) => {
        const ports: Port[] = DEFAULT_PORTS[type].map((p) => ({ ...p, id: uuid() }))
        const isZone = type === 'zone'
        const node: NetworkNode = {
          id: uuid(),
          type,
          position: { x: 160 + Math.random() * 200, y: 80 + Math.random() * 150 },
          zIndex: isZone ? -1 : 0,
          style: isZone ? { width: 280, height: 200 } : undefined,
          data: {
            label: NODE_LABELS[type],
            nodeType: type,
            ports,
          },
        }
        state.nodes.push(node)
      }),

    removeNode: (id) =>
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== id)
        state.edges = state.edges.filter((e) => e.source !== id && e.target !== id)
        if (state.selectedNodeId === id) state.selectedNodeId = null
      }),

    updateNodeData: (id, patch) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) Object.assign(node.data, patch)
      }),

    addPort: (nodeId, port) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId)
        if (node) node.data.ports.push(port)
      }),

    updatePort: (nodeId, portId, patch) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId)
        if (!node) return
        const port = node.data.ports.find((p) => p.id === portId)
        if (port) Object.assign(port, patch)
      }),

    removePort: (nodeId, portId) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId)
        if (node) node.data.ports = node.data.ports.filter((p) => p.id !== portId)
        state.edges = state.edges.filter(
          (e) => e.sourceHandle !== portId && e.targetHandle !== portId
        )
      }),

    duplicateNode: (id) =>
      set((state) => {
        const original = state.nodes.find((n) => n.id === id)
        if (!original) return
        const newId = uuid()
        const copy: NetworkNode = {
          ...original,
          id: newId,
          position: { x: original.position.x + 32, y: original.position.y + 32 },
          selected: false,
          data: {
            ...original.data,
            label: original.data.label + ' (Kopie)',
            ports: original.data.ports.map((p) => ({ ...p, id: uuid() })),
          },
        }
        state.nodes.push(copy)
      }),

    addEdge: (edge) =>
      set((state) => {
        const exists = state.edges.some(
          (e) =>
            (e.sourceHandle === edge.sourceHandle && e.targetHandle === edge.targetHandle) ||
            (e.sourceHandle === edge.targetHandle && e.targetHandle === edge.sourceHandle)
        )
        if (!exists) state.edges.push(edge as NetworkEdge)
      }),

    removeEdge: (id) =>
      set((state) => {
        state.edges = state.edges.filter((e) => e.id !== id)
        if (state.selectedEdgeId === id) state.selectedEdgeId = null
      }),

    updateEdgeLabel: (id, label) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === id)
        if (edge) {
          edge.label = label
          if (edge.data) edge.data.label = label
        }
      }),

    updateEdgeData: (id, patch) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === id)
        if (edge?.data) Object.assign(edge.data, patch)
      }),

    updateNodeStyle: (id, style) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) node.style = style as typeof node.style
      }),

    updateProjectInfo: (patch) =>
      set((state) => {
        Object.assign(state.projectInfo, patch)
      }),

    setSelectedNode: (id) =>
      set((state) => {
        state.selectedNodeId = id
        state.selectedEdgeId = null
        state.nodes = state.nodes.map((n) => ({ ...n, selected: n.id === id }))
        state.edges = state.edges.map((e) => ({ ...e, selected: false }))
      }),

    setSelectedEdge: (id) =>
      set((state) => {
        state.selectedEdgeId = id
        state.selectedNodeId = null
        state.nodes = state.nodes.map((n) => ({ ...n, selected: false }))
        state.edges = state.edges.map((e) => ({ ...e, selected: e.id === id }))
      }),

    loadDiagram: ({ nodes, edges, projectInfo }) =>
      set((state) => {
        state.nodes = nodes
        state.edges = edges
        state.projectInfo = projectInfo ?? { ...DEFAULT_PROJECT_INFO }
        state.selectedNodeId = null
        state.selectedEdgeId = null
      }),
  }))
)
