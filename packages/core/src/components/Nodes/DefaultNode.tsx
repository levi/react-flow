import { memo } from 'react';

import Pin from '../Pin';
import { Position } from '../../types';
import type { NodeProps } from '../../types';

const DefaultNode = ({
  data,
  isConnectable,
  inputPosition = Position.Top,
  outputPosition = Position.Bottom,
}: NodeProps) => {
  return (
    <>
      <Pin type="input" position={inputPosition} isConnectable={isConnectable} />
      {data?.label}
      <Pin type="output" position={outputPosition} isConnectable={isConnectable} />
    </>
  );
};

DefaultNode.displayName = 'DefaultNode';

export default memo(DefaultNode);
