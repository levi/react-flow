import { memo } from 'react';

import BaseEdge from './BaseEdge';
import { getEdgeCenter } from './utils';
import { Position } from '../../types';
import type { SmoothStepEdgeProps, XYPosition } from '../../types';

export interface GetSmoothStepPathParams {
  outputX: number;
  outputY: number;
  outputPosition?: Position;
  inputX: number;
  inputY: number;
  inputPosition?: Position;
  borderRadius?: number;
  centerX?: number;
  centerY?: number;
  offset?: number;
}

const pinDirections = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

const getDirection = ({
  output,
  outputPosition = Position.Bottom,
  input,
}: {
  output: XYPosition;
  outputPosition: Position;
  input: XYPosition;
}): XYPosition => {
  if (outputPosition === Position.Left || outputPosition === Position.Right) {
    return output.x < input.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }
  return output.y < input.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
};

const distance = (a: XYPosition, b: XYPosition) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

// ith this function we try to mimic a orthogonal edge routing behaviour
// It's not as good as a real orthogonal edge routing but it's faster and good enough as a default for step and smooth step edges
function getPoints({
  output,
  outputPosition = Position.Bottom,
  input,
  inputPosition = Position.Top,
  center,
  offset,
}: {
  output: XYPosition;
  outputPosition: Position;
  input: XYPosition;
  inputPosition: Position;
  center: Partial<XYPosition>;
  offset: number;
}): [XYPosition[], number, number, number, number] {
  const outputDir = pinDirections[outputPosition];
  const inputDir = pinDirections[inputPosition];
  const outputGapped: XYPosition = { x: output.x + outputDir.x * offset, y: output.y + outputDir.y * offset };
  const inputGapped: XYPosition = { x: input.x + inputDir.x * offset, y: input.y + inputDir.y * offset };
  const dir = getDirection({
    output: outputGapped,
    outputPosition,
    input: inputGapped,
  });
  const dirAccessor = dir.x !== 0 ? 'x' : 'y';
  const currDir = dir[dirAccessor];

  let points: XYPosition[] = [];
  let centerX, centerY;
  const [defaultCenterX, defaultCenterY, defaultOffsetX, defaultOffsetY] = getEdgeCenter({
    outputX: output.x,
    outputY: output.y,
    inputX: input.x,
    inputY: input.y,
  });

  // opposite pin positions, default case
  if (outputDir[dirAccessor] * inputDir[dirAccessor] === -1) {
    centerX = center.x || defaultCenterX;
    centerY = center.y || defaultCenterY;
    //    --->
    //    |
    // >---
    const verticalSplit: XYPosition[] = [
      { x: centerX, y: outputGapped.y },
      { x: centerX, y: inputGapped.y },
    ];
    //    |
    //  ---
    //  |
    const horizontalSplit: XYPosition[] = [
      { x: outputGapped.x, y: centerY },
      { x: inputGapped.x, y: centerY },
    ];

    if (outputDir[dirAccessor] === currDir) {
      points = dirAccessor === 'x' ? verticalSplit : horizontalSplit;
    } else {
      points = dirAccessor === 'x' ? horizontalSplit : verticalSplit;
    }
  } else {
    // outputInput means we take x from output and y from input, inputOutput is the opposite
    const outputInput: XYPosition[] = [{ x: outputGapped.x, y: inputGapped.y }];
    const inputOutput: XYPosition[] = [{ x: inputGapped.x, y: outputGapped.y }];
    // this pins edges with same pin positions
    if (dirAccessor === 'x') {
      points = outputDir.x === currDir ? inputOutput : outputInput;
    } else {
      points = outputDir.y === currDir ? outputInput : inputOutput;
    }

    // these are conditions for handling mixed pin positions like Right -> Bottom for example
    if (outputPosition !== inputPosition) {
      const dirAccessorOpposite = dirAccessor === 'x' ? 'y' : 'x';
      const isSameDir = outputDir[dirAccessor] === inputDir[dirAccessorOpposite];
      const outputGtInputOppo = outputGapped[dirAccessorOpposite] > inputGapped[dirAccessorOpposite];
      const outputLtInputOppo = outputGapped[dirAccessorOpposite] < inputGapped[dirAccessorOpposite];
      const flipSourceInput =
        (outputDir[dirAccessor] === 1 && ((!isSameDir && outputGtInputOppo) || (isSameDir && outputLtInputOppo))) ||
        (outputDir[dirAccessor] !== 1 && ((!isSameDir && outputLtInputOppo) || (isSameDir && outputGtInputOppo)));

      if (flipSourceInput) {
        points = dirAccessor === 'x' ? outputInput : inputOutput;
      }
    }

    centerX = points[0].x;
    centerY = points[0].y;
  }

  const pathPoints = [output, outputGapped, ...points, inputGapped, input];

  return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}

function getBend(a: XYPosition, b: XYPosition, c: XYPosition, size: number): string {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;

  // no bend
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`;
  }

  // first segment is horizontal
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }

  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

export function getSmoothStepPath({
  outputX,
  outputY,
  outputPosition = Position.Bottom,
  inputX,
  inputY,
  inputPosition = Position.Top,
  borderRadius = 5,
  centerX,
  centerY,
  offset = 20,
}: GetSmoothStepPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [points, labelX, labelY, offsetX, offsetY] = getPoints({
    output: { x: outputX, y: outputY },
    outputPosition,
    input: { x: inputX, y: inputY },
    inputPosition,
    center: { x: centerX, y: centerY },
    offset,
  });

  const path = points.reduce<string>((res, p, i) => {
    let segment = '';

    if (i > 0 && i < points.length - 1) {
      segment = getBend(points[i - 1], p, points[i + 1], borderRadius);
    } else {
      segment = `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`;
    }

    res += segment;

    return res;
  }, '');

  return [path, labelX, labelY, offsetX, offsetY];
}

const SmoothStepEdge = memo(
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
    outputPosition = Position.Bottom,
    inputPosition = Position.Top,
    markerEnd,
    markerStart,
    pathOptions,
    interactionWidth,
  }: SmoothStepEdgeProps) => {
    const [path, labelX, labelY] = getSmoothStepPath({
      outputX,
      outputY,
      outputPosition,
      inputX,
      inputY,
      inputPosition,
      borderRadius: pathOptions?.borderRadius,
      offset: pathOptions?.offset,
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

SmoothStepEdge.displayName = 'SmoothStepEdge';

export default SmoothStepEdge;
