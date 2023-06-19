import { MouseEvent, RefObject } from 'react'
import { StoreApi } from 'zustand'

import { getDimensions } from '../../utils'
import { Position } from '../../types'
import type { PinElement, Node, NodeOrigin, ReactFlowState } from '../../types'

export const getPinBounds = (
  selector: string,
  nodeElement: HTMLDivElement,
  zoom: number,
  nodeOrigin: NodeOrigin
): PinElement[] | null => {
  const pins = nodeElement.querySelectorAll(selector)

  if (!pins || !pins.length) {
    return null
  }

  const pinsArray = Array.from(pins) as HTMLDivElement[]
  const nodeBounds = nodeElement.getBoundingClientRect()
  const nodeOffset = {
    x: nodeBounds.width * nodeOrigin[0],
    y: nodeBounds.height * nodeOrigin[1],
  }

  return pinsArray.map((pin): PinElement => {
    const pinBounds = pin.getBoundingClientRect()

    return {
      id: pin.getAttribute('data-pinid'),
      position: pin.getAttribute('data-pinpos') as unknown as Position,
      x: (pinBounds.left - nodeBounds.left - nodeOffset.x) / zoom,
      y: (pinBounds.top - nodeBounds.top - nodeOffset.y) / zoom,
      ...getDimensions(pin),
    }
  })
}

export function getMouseHandler(
  id: string,
  getState: StoreApi<ReactFlowState>['getState'],
  handler?: (event: MouseEvent, node: Node) => void
) {
  return handler === undefined
    ? handler
    : (event: MouseEvent) => {
      const node = getState().nodeInternals.get(id)!
      handler(event, { ...node })
    }
}

// this handler is called by
// 1. the click handler when node is not draggable or selectNodesOnDrag = false
// or
// 2. the on drag start handler when node is draggable and selectNodesOnDrag = true
export function handleNodeClick({
  id,
  store,
  unselect = false,
  nodeRef,
}: {
  id: string
  store: {
    getState: StoreApi<ReactFlowState>['getState']
    setState: StoreApi<ReactFlowState>['setState']
  }
  unselect?: boolean
  nodeRef?: RefObject<HTMLDivElement>
}) {
  const { addSelectedNodes, unselectNodesAndEdges, multiSelectionActive, nodeInternals } = store.getState()
  const node = nodeInternals.get(id)!

  store.setState({ nodesSelectionActive: false })

  if (!node.selected) {
    addSelectedNodes([id])
  } else if (unselect || (node.selected && multiSelectionActive)) {
    unselectNodesAndEdges({ nodes: [node] })

    requestAnimationFrame(() => nodeRef?.current?.blur())
  }
}
