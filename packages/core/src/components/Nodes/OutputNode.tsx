import { memo } from 'react';

import Pin from '../Pin';
import { Position } from '../../types';
import type { NodeProps } from '../../types';

const OutputNode = ({ data, isConnectable, inputPosition = Position.Top }: NodeProps) => (
  <>
    <Pin type="input" position={inputPosition} isConnectable={isConnectable} />
    {data?.label}
  </>
);

OutputNode.displayName = 'OutputNode';

export default memo(OutputNode);
