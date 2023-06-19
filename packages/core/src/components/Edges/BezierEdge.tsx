import { memo } from 'react';

import BaseEdge from './BaseEdge';
import { getBezierEdgeCenter } from './utils';
import { Position } from '../../types';
import type { BezierEdgeProps } from '../../types';

export interface GetBezierPathParams {
  outputX: number;
  outputY: number;
  outputPosition?: Position;
  inputX: number;
  inputY: number;
  inputPosition?: Position;
  curvature?: number;
}

interface GetControlWithCurvatureParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: number;
}

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance;
  }

  return curvature * 25 * Math.sqrt(-distance);
}

function getControlWithCurvature({ pos, x1, y1, x2, y2, c }: GetControlWithCurvatureParams): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
  }
}

export function getBezierPath({
  outputX,
  outputY,
  outputPosition = Position.Bottom,
  inputX,
  inputY,
  inputPosition = Position.Top,
  curvature = 0.25,
}: GetBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [outputControlX, outputControlY] = getControlWithCurvature({
    pos: outputPosition,
    x1: outputX,
    y1: outputY,
    x2: inputX,
    y2: inputY,
    c: curvature,
  });
  const [inputControlX, inputControlY] = getControlWithCurvature({
    pos: inputPosition,
    x1: inputX,
    y1: inputY,
    x2: outputX,
    y2: outputY,
    c: curvature,
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    outputX,
    outputY,
    inputX,
    inputY,
    outputControlX: outputControlX,
    outputControlY: outputControlY,
    inputControlX: inputControlX,
    inputControlY: inputControlY,
  });

  return [
    `M${outputX},${outputY} C${outputControlX},${outputControlY} ${inputControlX},${inputControlY} ${inputX},${inputY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

const BezierEdge = memo(
  ({
    outputX,
    outputY,
    inputX,
    inputY,
    outputPosition = Position.Bottom,
    inputPosition = Position.Top,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    markerEnd,
    markerStart,
    pathOptions,
    interactionWidth,
  }: BezierEdgeProps) => {
    const [path, labelX, labelY] = getBezierPath({
      outputX,
      outputY,
      outputPosition,
      inputX,
      inputY,
      inputPosition,
      curvature: pathOptions?.curvature,
    });

    return (
      <BaseEdge
        path={path}
        labelX={labelX}
        labelY={labelY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={labelShowBg}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />
    );
  }
);

BezierEdge.displayName = 'BezierEdge';

export default BezierEdge;
