import { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'

import { ConnectingPin, ConnectionMode, ConnectionStatus } from '../../types'
import { getEventPosition, internalsSymbol } from '../../utils'
import type { Connection, PinType, XYPosition, Node, NodePinBounds } from '../../types'

export type ConnectionPin = {
  id: string | null
  type: PinType
  nodeId: string
  x: number
  y: number
}

export type ValidConnectionFunc = (connection: Connection) => boolean

// this functions collects all pins and adds an absolute position
// so that we can later find the closest pin to the mouse position
export function getPins(
  node: Node,
  pinBounds: NodePinBounds,
  type: PinType,
  currentPin: string
): ConnectionPin[] {
  return (pinBounds[type] || []).reduce<ConnectionPin[]>((res, h) => {
    if (`${node.id}-${h.id}-${type}` !== currentPin) {
      res.push({
        id: h.id || null,
        type,
        nodeId: node.id,
        x: (node.positionAbsolute?.x ?? 0) + h.x + h.width / 2,
        y: (node.positionAbsolute?.y ?? 0) + h.y + h.height / 2,
      })
    }
    return res
  }, [])
}

export function getClosestPin(
  pos: XYPosition,
  connectionRadius: number,
  pins: ConnectionPin[]
): ConnectionPin | null {
  let closestPins: ConnectionPin[] = []
  let minDistance = Infinity

  pins.forEach((pin) => {
    const distance = Math.sqrt(Math.pow(pin.x - pos.x, 2) + Math.pow(pin.y - pos.y, 2))
    if (distance <= connectionRadius) {
      if (distance < minDistance) {
        closestPins = [pin]
      } else if (distance === minDistance) {
        // when multiple pins are on the same distance we collect all of them
        closestPins.push(pin)
      }
      minDistance = distance
    }
  })

  if (!closestPins.length) {
    return null
  }

  return closestPins.length === 1
    ? closestPins[0]
    : // if multiple pins are layouted on top of each other we take the one with type = input because it's more likely that the user wants to connect to this one
    closestPins.find((pin) => pin.type === 'input') || closestPins[0]
}

type Result = {
  pinDomNode: Element | null
  isValid: boolean
  connection: Connection
  endPin: ConnectingPin | null
}

const nullConnection: Connection = { output: null, input: null, outputPin: null, inputPin: null }

// checks if  and returns connection in fom of an object { output: 123, input: 312 }
export function isValidPin(
  event: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent,
  pin: Pick<ConnectionPin, 'nodeId' | 'id' | 'type'> | null,
  connectionMode: ConnectionMode,
  fromNodeId: string,
  fromPinId: string | null,
  fromType: PinType,
  isValidConnection: ValidConnectionFunc,
  doc: Document | ShadowRoot
) {
  const isInput = fromType === 'input'
  const pinDomNode = doc.querySelector(
    `.react-flow__pin[data-id="${pin?.nodeId}-${pin?.id}-${pin?.type}"]`
  )
  const { x, y } = getEventPosition(event)
  const pinBelow = doc.elementFromPoint(x, y)
  // we always want to prioritize the pin below the mouse cursor over the closest distance pin,
  // because it could be that the center of another pin is closer to the mouse pointer than the pin below the cursor
  const pinToCheck = pinBelow?.classList.contains('react-flow__pin') ? pinBelow : pinDomNode

  const result: Result = {
    pinDomNode: pinToCheck,
    isValid: false,
    connection: nullConnection,
    endPin: null,
  }

  if (pinToCheck) {
    const pinType = getPinType(undefined, pinToCheck)
    const pinNodeId = pinToCheck.getAttribute('data-nodeid')
    const pinId = pinToCheck.getAttribute('data-pinid')
    const connectable = pinToCheck.classList.contains('connectable')
    const connectableEnd = pinToCheck.classList.contains('connectableend')

    const connection: Connection = {
      output: isInput ? pinNodeId : fromNodeId,
      outputPin: isInput ? pinId : fromPinId,
      input: isInput ? fromNodeId : pinNodeId,
      inputPin: isInput ? fromPinId : pinId,
    }

    result.connection = connection

    const isConnectable = connectable && connectableEnd
    // in strict mode we don't allow input to input or output to output connections
    const isValid =
      isConnectable &&
      (connectionMode === ConnectionMode.Strict
        ? (isInput && pinType === 'output') || (!isInput && pinType === 'input')
        : pinNodeId !== fromNodeId || pinId !== fromPinId)

    if (isValid) {
      result.endPin = {
        nodeId: pinNodeId as string,
        pinId: pinId,
        type: pinType as PinType,
      }

      result.isValid = isValidConnection(connection)
    }
  }

  return result
}

type GetPinLookupParams = {
  nodes: Node[]
  nodeId: string
  pinId: string | null
  pinType: string
}

export function getPinLookup({ nodes, nodeId, pinId, pinType }: GetPinLookupParams) {
  return nodes.reduce<ConnectionPin[]>((res, node) => {
    if (node[internalsSymbol]) {
      const { pinBounds } = node[internalsSymbol]
      let outputPins: ConnectionPin[] = []
      let inputPins: ConnectionPin[] = []

      if (pinBounds) {
        outputPins = getPins(node, pinBounds, 'output', `${nodeId}-${pinId}-${pinType}`)
        inputPins = getPins(node, pinBounds, 'input', `${nodeId}-${pinId}-${pinType}`)
      }

      res.push(...outputPins, ...inputPins)
    }
    return res
  }, [])
}

export function getPinType(
  edgeUpdaterType: PinType | undefined,
  pinDomNode: Element | null
): PinType | null {
  if (edgeUpdaterType) {
    return edgeUpdaterType
  } else if (pinDomNode?.classList.contains('input')) {
    return 'input'
  } else if (pinDomNode?.classList.contains('output')) {
    return 'output'
  }

  return null
}

export function resetRecentPin(pinDomNode: Element): void {
  pinDomNode?.classList.remove('valid', 'connecting', 'react-flow__pin-valid', 'react-flow__pin-connecting')
}

export function getConnectionStatus(isInsideConnectionRadius: boolean, isPinValid: boolean) {
  let connectionStatus = null

  if (isPinValid) {
    connectionStatus = 'valid'
  } else if (isInsideConnectionRadius && !isPinValid) {
    connectionStatus = 'invalid'
  }

  return connectionStatus as ConnectionStatus
}
