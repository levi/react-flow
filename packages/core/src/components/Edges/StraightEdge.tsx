import { memo } from 'react';

import BaseEdge from './BaseEdge';
import { getEdgeCenter } from './utils';
import type { EdgeProps } from '../../types';

export type GetStraightPathParams = {
  outputX: number;
  outputY: number;
  inputX: number;
  inputY: number;
};

export function getStraightPath({
  outputX,
  outputY,
  inputX,
  inputY,
}: GetStraightPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
    outputX,
    outputY,
    inputX,
    inputY,
  });

  return [`M ${outputX},${outputY}L ${inputX},${inputY}`, labelX, labelY, offsetX, offsetY];
}

const StraightEdge = memo(
  ({
    outputX,
    outputY,
    inputX,
    inputY,
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
    const [path, labelX, labelY] = getStraightPath({ outputX, outputY, inputX, inputY });

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

StraightEdge.displayName = 'StraightEdge';

export default StraightEdge;
