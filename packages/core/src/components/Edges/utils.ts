import { MouseEvent as ReactMouseEvent } from 'react'
import { StoreApi } from 'zustand'

import type { Edge, MarkerType, ReactFlowState } from '../../types'

export const getMarkerEnd = (markerType?: MarkerType, markerEndId?: string): string => {
  if (typeof markerEndId !== 'undefined' && markerEndId) {
    return `url(#${markerEndId})`
  }

  return typeof markerType !== 'undefined' ? `url(#react-flow__${markerType})` : 'none'
}

export function getMouseHandler(
  id: string,
  getState: StoreApi<ReactFlowState>['getState'],
  handler?: (event: ReactMouseEvent<SVGGElement, MouseEvent>, edge: Edge) => void
) {
  return handler === undefined
    ? handler
    : (event: ReactMouseEvent<SVGGElement, MouseEvent>) => {
      const edge = getState().edges.find((e) => e.id === id)

      if (edge) {
        handler(event, { ...edge })
      }
    }
}

// this is used for straight edges and simple smoothstep edges (LTR, RTL, BTT, TTB)
export function getEdgeCenter({
  outputX,
  outputY,
  inputX,
  inputY,
}: {
  outputX: number
  outputY: number
  inputX: number
  inputY: number
}): [number, number, number, number] {
  const xOffset = Math.abs(inputX - outputX) / 2
  const centerX = inputX < outputX ? inputX + xOffset : inputX - xOffset

  const yOffset = Math.abs(inputY - outputY) / 2
  const centerY = inputY < outputY ? inputY + yOffset : inputY - yOffset

  return [centerX, centerY, xOffset, yOffset]
}

export function getBezierEdgeCenter({
  outputX,
  outputY,
  inputX,
  inputY,
  outputControlX,
  outputControlY,
  inputControlX,
  inputControlY,
}: {
  outputX: number
  outputY: number
  inputX: number
  inputY: number
  outputControlX: number
  outputControlY: number
  inputControlX: number
  inputControlY: number
}): [number, number, number, number] {
  // cubic bezier t=0.5 mid point, not the actual mid point, but easy to calculate
  // https://stackoverflow.com/questions/67516101/how-to-find-distance-mid-point-of-bezier-curve
  const centerX = outputX * 0.125 + outputControlX * 0.375 + inputControlX * 0.375 + inputX * 0.125
  const centerY = outputY * 0.125 + outputControlY * 0.375 + inputControlY * 0.375 + inputY * 0.125
  const offsetX = Math.abs(centerX - outputX)
  const offsetY = Math.abs(centerY - outputY)

  return [centerX, centerY, offsetX, offsetY]
}
