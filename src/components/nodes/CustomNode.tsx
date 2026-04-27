import type { NodeProps } from 'reactflow'
import type { NetworkNodeData } from '../../types/diagram'
import { BaseNetworkNode } from './BaseNetworkNode'

const DEFAULT_COLOR = '#6366f1'

export function CustomNode(props: NodeProps<NetworkNodeData>) {
  const color = props.data.customColor ?? DEFAULT_COLOR
  return <BaseNetworkNode {...props} icon="◆" color={color} />
}
