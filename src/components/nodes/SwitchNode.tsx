import type { NodeProps } from 'reactflow'
import type { NetworkNodeData } from '../../types/diagram'
import { BaseNetworkNode } from './BaseNetworkNode'
import { NODE_COLORS, NODE_ICONS } from '../../constants/nodeDefinitions'

export function SwitchNode(props: NodeProps<NetworkNodeData>) {
  return <BaseNetworkNode {...props} icon={NODE_ICONS.switch} color={NODE_COLORS.switch} />
}
