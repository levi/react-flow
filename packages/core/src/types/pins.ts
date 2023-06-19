import type { XYPosition, Position, Dimensions, OnConnect, Connection } from '.'

export type PinType = 'output' | 'input'

export type PinElement = XYPosition &
  Dimensions & {
    id?: string | null
    position: Position
  }

export type ConnectingPin = {
  nodeId: string
  type: PinType
  pinId?: string | null
}

export type PinProps = {
  type: PinType
  position: Position
  isConnectable?: boolean
  isConnectableStart?: boolean
  isConnectableEnd?: boolean
  onConnect?: OnConnect
  isValidConnection?: (connection: Connection) => boolean
  id?: string
}
