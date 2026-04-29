import type { NodeType, Port } from '../types/diagram'

type PortTemplate = Omit<Port, 'id'>

export const DEFAULT_PORTS: Record<NodeType, PortTemplate[]> = {
  server: [
    { type: 'eth', name: 'eth0' },
    { type: 'eth', name: 'eth1' },
  ],
  switch: [
    { type: 'eth', name: 'GE1' },
    { type: 'eth', name: 'GE2' },
    { type: 'eth', name: 'GE3' },
    { type: 'eth', name: 'GE4' },
  ],
  vpn_router: [
    { type: 'eth', name: 'WAN' },
    { type: 'eth', name: 'LAN' },
  ],
  firewall: [
    { type: 'eth', name: 'IN' },
    { type: 'eth', name: 'OUT' },
    { type: 'eth', name: 'DMZ' },
  ],
  plc: [
    { type: 'eth', name: 'X1' },
    { type: 'eth', name: 'X2' },
  ],
  zone: [],
  rack: [],
  custom: [],
}

export const NODE_LABELS: Record<NodeType, string> = {
  server: 'Server',
  switch: 'Switch',
  vpn_router: 'VPN-Router',
  firewall: 'Firewall',
  plc: 'SPS',
  zone: 'Zone',
  rack: 'Server Rack',
  custom: 'Benutzerdefiniert',
}

export const NODE_ICONS: Record<NodeType, string> = {
  server: '🖥',
  switch: '🔀',
  vpn_router: '🌐',
  firewall: '🛡',
  plc: '⚙',
  zone: '▭',
  rack: '▤',
  custom: '◆',
}

// Default column span (out of 5) when adding a node to a rack
export const DEFAULT_RACK_COLSPAN: Partial<Record<NodeType, number>> = {
  server:     5,
  switch:     2,
  vpn_router: 2,
  firewall:   3,
  plc:        1,
  custom:     2,
}

export const NODE_COLORS: Record<NodeType, string> = {
  server: '#3b82f6',
  switch: '#10b981',
  vpn_router: '#8b5cf6',
  firewall: '#ef4444',
  plc: '#f59e0b',
  zone: '#64748b',
  rack: '#1e293b',
  custom: '#6366f1',
}
