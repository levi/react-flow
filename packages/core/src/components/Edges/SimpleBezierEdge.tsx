import { memo } from 'react';

import BaseEdge from './BaseEdge';
import { getBezierEdgeCenter } from './utils';
import { Position } from '../../types';
import type { EdgeProps } from '../../types';

export interface GetSimpleBezierPathParams {
  outputX: number;
  outputY: number;
  outputPosition?: Position;
  inputX: number;
  inputY: number;
  inputPosition?: Position;
}

interface GetControlParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getControl({ pos, x1, y1, x2, y2 }: GetControlParams): [number, number] {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }

  return [x1, 0.5 * (y1 + y2)];
}

export function getSimpleBezierPath({
  outputX,
  outputY,
  outputPosition = Position.Bottom,
  inputX,
  inputY,
  inputPosition = Position.Top,
}: GetSimpleBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [outputControlX, outputControlY] = getControl({
    pos: outputPosition,
    x1: outputX,
    y1: outputY,
    x2: inputX,
    y2: inputY,
  });
  const [inputControlX, inputControlY] = getControl({
    pos: inputPosition,
    x1: inputX,
    y1: inputY,
    x2: outputX,
    y2: outputY,
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

const SimpleBezierEdge = memo(
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
    interactionWidth,
  }: EdgeProps) => {
    const [path, labelX, labelY] = getSimpleBezierPath({
      outputX,
      outputY,
      outputPosition,
      inputX,
      inputY,
      inputPosition,
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

SimpleBezierEdge.displayName = 'SimpleBezierEdge';

export default SimpleBezierEdge;
