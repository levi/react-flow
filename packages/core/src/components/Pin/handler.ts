import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'
import { StoreApi } from 'zustand'

import { getHostForElement, calcAutoPan, getEventPosition } from '../../utils'
import type { OnConnect, PinType, ReactFlowState, Connection } from '../../types'
import { pointToRendererPoint, rendererPointToPoint } from '../../utils/graph'
import {
  ConnectionPin,
  getClosestPin,
  getConnectionStatus,
  getPinLookup,
  getPinType,
  isValidPin,
  resetRecentPin,
  ValidConnectionFunc,
} from './utils'

export function handlePointerDown({
  event,
  pinId,
  nodeId,
  onConnect,
  isInput,
  getState,
  setState,
  isValidConnection,
  edgeUpdaterType,
  onEdgeUpdateEnd,
}: {
  event: ReactMouseEvent | ReactTouchEvent
  pinId: string | null
  nodeId: string
  onConnect: OnConnect
  isInput: boolean
  getState: StoreApi<ReactFlowState>['getState']
  setState: StoreApi<ReactFlowState>['setState']
  isValidConnection: ValidConnectionFunc
  edgeUpdaterType?: PinType
  onEdgeUpdateEnd?: (evt: MouseEvent | TouchEvent) => void
}): void {
  // when react-flow is used inside a shadow root we can't use document
  const doc = getHostForElement(event.target as HTMLElement)
  const {
    connectionMode,
    domNode,
    autoPanOnConnect,
    connectionRadius,
    onConnectStart,
    panBy,
    getNodes,
    cancelConnection,
  } = getState()
  let autoPanId = 0
  let closestPin: ConnectionPin | null

  const { x, y } = getEventPosition(event)
  const clickedPin = doc?.elementFromPoint(x, y)
  const pinType = getPinType(edgeUpdaterType, clickedPin)
  const containerBounds = domNode?.getBoundingClientRect()

  if (!containerBounds || !pinType) {
    return
  }

  let prevActivePin: Element
  let connectionPosition = getEventPosition(event, containerBounds)
  let autoPanStarted = false
  let connection: Connection | null = null
  let isValid = false
  let pinDomNode: Element | null = null

  const pinLookup = getPinLookup({
    nodes: getNodes(),
    nodeId,
    pinId: pinId,
    pinType: pinType,
  })

  // when the user is moving the mouse close to the edge of the canvas while connecting we move the canvas
  const autoPan = (): void => {
    if (!autoPanOnConnect) {
      return
    }
    const [xMovement, yMovement] = calcAutoPan(connectionPosition, containerBounds)

    panBy({ x: xMovement, y: yMovement })
    autoPanId = requestAnimationFrame(autoPan)
  }

  setState({
    connectionPosition,
    connectionStatus: null,
    // connectionNodeId etc will be removed in the next major in favor of connectionStartPin
    connectionNodeId: nodeId,
    connectionPinId: pinId,
    connectionPinType: pinType,
    connectionStartPin: {
      nodeId,
      pinId,
      type: pinType,
    },
    connectionEndPin: null,
  })

  onConnectStart?.(event, { nodeId, pinId, pinType })

  function onPointerMove(event: MouseEvent | TouchEvent) {
    const { transform } = getState()

    connectionPosition = getEventPosition(event, containerBounds)
    closestPin = getClosestPin(
      pointToRendererPoint(connectionPosition, transform, false, [1, 1]),
      connectionRadius,
      pinLookup
    )

    if (!autoPanStarted) {
      autoPan()
      autoPanStarted = true
    }

    const result = isValidPin(
      event,
      closestPin,
      connectionMode,
      nodeId,
      pinId,
      isInput ? 'input' : 'output',
      isValidConnection,
      doc
    )

    pinDomNode = result.pinDomNode
    connection = result.connection
    isValid = result.isValid

    setState({
      connectionPosition:
        closestPin && isValid
          ? rendererPointToPoint(
            {
              x: closestPin.x,
              y: closestPin.y,
            },
            transform
          )
          : connectionPosition,
      connectionStatus: getConnectionStatus(!!closestPin, isValid),
      connectionEndPin: result.endPin,
    })

    if (!closestPin && !isValid && !pinDomNode) {
      return resetRecentPin(prevActivePin)
    }

    if (connection.output !== connection.input && pinDomNode) {
      resetRecentPin(prevActivePin)
      prevActivePin = pinDomNode
      // @todo: remove the old class names "react-flow__pin-" in the next major version
      pinDomNode.classList.add('connecting', 'react-flow__pin-connecting')
      pinDomNode.classList.toggle('valid', isValid)
      pinDomNode.classList.toggle('react-flow__pin-valid', isValid)
    }
  }

  function onPointerUp(event: MouseEvent | TouchEvent) {
    if ((closestPin || pinDomNode) && connection && isValid) {
      onConnect?.(connection)
    }

    // it's important to get a fresh reference from the store here
    // in order to get the latest state of onConnectEnd
    getState().onConnectEnd?.(event)

    if (edgeUpdaterType) {
      onEdgeUpdateEnd?.(event)
    }

    resetRecentPin(prevActivePin)
    cancelConnection()
    cancelAnimationFrame(autoPanId)
    autoPanStarted = false
    isValid = false
    connection = null
    pinDomNode = null

    doc.removeEventListener('mousemove', onPointerMove as EventListener)
    doc.removeEventListener('mouseup', onPointerUp as EventListener)

    doc.removeEventListener('touchmove', onPointerMove as EventListener)
    doc.removeEventListener('touchend', onPointerUp as EventListener)
  }

  doc.addEventListener('mousemove', onPointerMove as EventListener)
  doc.addEventListener('mouseup', onPointerUp as EventListener)

  doc.addEventListener('touchmove', onPointerMove as EventListener)
  doc.addEventListener('touchend', onPointerUp as EventListener)
}
