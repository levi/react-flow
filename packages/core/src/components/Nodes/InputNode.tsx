import { memo } from 'react';

import Pin from '../Pin';
import { Position } from '../../types';
import type { NodeProps } from '../../types';

const InputNode = ({ data, isConnectable, outputPosition = Position.Bottom }: NodeProps) => (
  <>
    {data?.label}
    <Pin type="output" position={outputPosition} isConnectable={isConnectable} />
  </>
);

InputNode.displayName = 'InputNode';

export default memo(InputNode);
