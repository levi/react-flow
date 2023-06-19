import type { ComponentType } from 'react'

import { BezierEdge, SmoothStepEdge, StepEdge, StraightEdge, SimpleBezierEdge } from '../../components/Edges'
import wrapEdge from '../../components/Edges/wrapEdge'
import { internalsSymbol, rectToBox } from '../../utils'
import { Position } from '../../types'
import type {
  EdgeProps,
  EdgeTypes,
  EdgeTypesWrapped,
  PinElement,
  NodePinBounds,
  Node,
  Rect,
  Transform,
  XYPosition,
} from '../../types'

export type CreateEdgeTypes = (edgeTypes: EdgeTypes) => EdgeTypesWrapped

export function createEdgeTypes(edgeTypes: EdgeTypes): EdgeTypesWrapped {
  const standardTypes: EdgeTypesWrapped = {
    default: wrapEdge((edgeTypes.default || BezierEdge) as ComponentType<EdgeProps>),
    straight: wrapEdge((edgeTypes.bezier || StraightEdge) as ComponentType<EdgeProps>),
    step: wrapEdge((edgeTypes.step || StepEdge) as ComponentType<EdgeProps>),
    smoothstep: wrapEdge((edgeTypes.step || SmoothStepEdge) as ComponentType<EdgeProps>),
    simplebezier: wrapEdge((edgeTypes.simplebezier || SimpleBezierEdge) as ComponentType<EdgeProps>),
  }

  const wrappedTypes = {} as EdgeTypesWrapped
  const specialTypes: EdgeTypesWrapped = Object.keys(edgeTypes)
    .filter((k) => !['default', 'bezier'].includes(k))
    .reduce((res, key) => {
      res[key] = wrapEdge((edgeTypes[key] || BezierEdge) as ComponentType<EdgeProps>)

      return res
    }, wrappedTypes)

  return {
    ...standardTypes,
    ...specialTypes,
  }
}

export function getPinPosition(position: Position, nodeRect: Rect, pin: PinElement | null = null): XYPosition {
  const x = (pin?.x || 0) + nodeRect.x
  const y = (pin?.y || 0) + nodeRect.y
  const width = pin?.width || nodeRect.width
  const height = pin?.height || nodeRect.height

  switch (position) {
    case Position.Top:
      return {
        x: x + width / 2,
        y,
      }
    case Position.Right:
      return {
        x: x + width,
        y: y + height / 2,
      }
    case Position.Bottom:
      return {
        x: x + width / 2,
        y: y + height,
      }
    case Position.Left:
      return {
        x,
        y: y + height / 2,
      }
  }
}

export function getPin(bounds: PinElement[], pinId?: string | null): PinElement | null {
  if (!bounds) {
    return null
  }

  if (bounds.length === 1 || !pinId) {
    return bounds[0]
  } else if (pinId) {
    return bounds.find((d) => d.id === pinId) || null
  }

  return null
}

interface EdgePositions {
  outputX: number
  outputY: number
  inputX: number
  inputY: number
}

export const getEdgePositions = (
  outputNodeRect: Rect,
  outputPin: PinElement,
  outputPosition: Position,
  inputNodeRect: Rect,
  inputPin: PinElement,
  inputPosition: Position
): EdgePositions => {
  const outputPinPos = getPinPosition(outputPosition, outputNodeRect, outputPin)
  const inputPinPos = getPinPosition(inputPosition, inputNodeRect, inputPin)

  return {
    outputX: outputPinPos.x,
    outputY: outputPinPos.y,
    inputX: inputPinPos.x,
    inputY: inputPinPos.y,
  }
}

interface IsEdgeVisibleParams {
  outputPos: XYPosition
  inputPos: XYPosition
  outputWidth: number
  outputHeight: number
  inputWidth: number
  inputHeight: number
  width: number
  height: number
  transform: Transform
}

export function isEdgeVisible({
  outputPos,
  inputPos,
  outputWidth,
  outputHeight,
  inputWidth,
  inputHeight,
  width,
  height,
  transform,
}: IsEdgeVisibleParams): boolean {
  const edgeBox = {
    x: Math.min(outputPos.x, inputPos.x),
    y: Math.min(outputPos.y, inputPos.y),
    x2: Math.max(outputPos.x + outputWidth, inputPos.x + inputWidth),
    y2: Math.max(outputPos.y + outputHeight, inputPos.y + inputHeight),
  }

  if (edgeBox.x === edgeBox.x2) {
    edgeBox.x2 += 1
  }

  if (edgeBox.y === edgeBox.y2) {
    edgeBox.y2 += 1
  }

  const viewBox = rectToBox({
    x: (0 - transform[0]) / transform[2],
    y: (0 - transform[1]) / transform[2],
    width: width / transform[2],
    height: height / transform[2],
  })

  const xOverlap = Math.max(0, Math.min(viewBox.x2, edgeBox.x2) - Math.max(viewBox.x, edgeBox.x))
  const yOverlap = Math.max(0, Math.min(viewBox.y2, edgeBox.y2) - Math.max(viewBox.y, edgeBox.y))
  const overlappingArea = Math.ceil(xOverlap * yOverlap)

  return overlappingArea > 0
}

export function getNodeData(node?: Node): [Rect, NodePinBounds | null, boolean] {
  const pinBounds = node?.[internalsSymbol]?.pinBounds || null

  const isValid =
    pinBounds &&
    node?.width &&
    node?.height &&
    typeof node?.positionAbsolute?.x !== 'undefined' &&
    typeof node?.positionAbsolute?.y !== 'undefined'

  return [
    {
      x: node?.positionAbsolute?.x || 0,
      y: node?.positionAbsolute?.y || 0,
      width: node?.width || 0,
      height: node?.height || 0,
    },
    pinBounds,
    !!isValid,
  ]
}
