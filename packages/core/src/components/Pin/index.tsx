import { memo, HTMLAttributes, forwardRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import cc from 'classcat';
import { shallow } from 'zustand/shallow';

import { useStore, useStoreApi } from '../../hooks/useStore';
import { useNodeId } from '../../contexts/NodeIdContext';
import { handlePointerDown } from './handler';
import { getHostForElement, isMouseEvent } from '../../utils';
import { addEdge } from '../../utils/graph';
import { type PinProps, type Connection, type ReactFlowState, PinType, Position } from '../../types';
import { isValidPin } from './utils';
import { errorMessages } from '../../contants';

const alwaysValid = () => true;

export type PinComponentProps = PinProps & Omit<HTMLAttributes<HTMLDivElement>, 'id'>;

const selector = (s: ReactFlowState) => ({
  connectionStartPin: s.connectionStartPin,
  connectOnClick: s.connectOnClick,
  noPanClassName: s.noPanClassName,
});

const connectingSelector =
  (nodeId: string | null, pinId: string | null, type: PinType) => (state: ReactFlowState) => {
    const {
      connectionStartPin: startPin,
      connectionEndPin: endPin,
      connectionClickStartPin: clickPin,
    } = state;

    return {
      connecting:
        (startPin?.nodeId === nodeId && startPin?.pinId === pinId && startPin?.type === type) ||
        (endPin?.nodeId === nodeId && endPin?.pinId === pinId && endPin?.type === type),
      clickConnecting:
        clickPin?.nodeId === nodeId && clickPin?.pinId === pinId && clickPin?.type === type,
    };
  };

const Pin = forwardRef<HTMLDivElement, PinComponentProps>(
  (
    {
      type = 'output',
      position = Position.Top,
      isValidConnection,
      isConnectable = true,
      isConnectableStart = true,
      isConnectableEnd = true,
      id,
      onConnect,
      children,
      className,
      onMouseDown,
      onTouchStart,
      ...rest
    },
    ref
  ) => {
    const pinId = id || null;
    const isInput = type === 'input';
    const store = useStoreApi();
    const nodeId = useNodeId();
    const { connectOnClick, noPanClassName } = useStore(selector, shallow);
    const { connecting, clickConnecting } = useStore(connectingSelector(nodeId, pinId, type), shallow);

    if (!nodeId) {
      store.getState().onError?.('010', errorMessages['error010']());
    }

    const onConnectExtended = (params: Connection) => {
      const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = store.getState();

      const edgeParams = {
        ...defaultEdgeOptions,
        ...params,
      };
      if (hasDefaultEdges) {
        const { edges, setEdges } = store.getState();
        setEdges(addEdge(edgeParams, edges));
      }

      onConnectAction?.(edgeParams);
      onConnect?.(edgeParams);
    };

    const onPointerDown = (event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
      if (!nodeId) {
        return;
      }

      const isMouseTriggered = isMouseEvent(event);

      if (isConnectableStart && ((isMouseTriggered && event.button === 0) || !isMouseTriggered)) {
        handlePointerDown({
          event,
          pinId,
          nodeId,
          onConnect: onConnectExtended,
          isInput: isInput,
          getState: store.getState,
          setState: store.setState,
          isValidConnection: isValidConnection || store.getState().isValidConnection || alwaysValid,
        });
      }

      if (isMouseTriggered) {
        onMouseDown?.(event);
      } else {
        onTouchStart?.(event);
      }
    };

    const onClick = (event: ReactMouseEvent) => {
      const {
        onClickConnectStart,
        onClickConnectEnd,
        connectionClickStartPin,
        connectionMode,
        isValidConnection: isValidConnectionStore,
      } = store.getState();

      if (!nodeId || (!connectionClickStartPin && !isConnectableStart)) {
        return;
      }

      if (!connectionClickStartPin) {
        onClickConnectStart?.(event, { nodeId, pinId, pinType: type });
        store.setState({ connectionClickStartPin: { nodeId, type, pinId } });
        return;
      }

      const doc = getHostForElement(event.target as HTMLElement);
      const isValidConnectionHandler = isValidConnection || isValidConnectionStore || alwaysValid;
      const { connection, isValid } = isValidPin(
        event,
        {
          nodeId,
          id: pinId,
          type,
        },
        connectionMode,
        connectionClickStartPin.nodeId,
        connectionClickStartPin.pinId || null,
        connectionClickStartPin.type,
        isValidConnectionHandler,
        doc
      );

      if (isValid) {
        onConnectExtended(connection);
      }

      onClickConnectEnd?.(event as unknown as MouseEvent);

      store.setState({ connectionClickStartPin: null });
    };

    return (
      <div
        data-pinid={pinId}
        data-nodeid={nodeId}
        data-pinpos={position}
        data-id={`${nodeId}-${pinId}-${type}`}
        className={cc([
          'react-flow__pin',
          `react-flow__pin-${position}`,
          'nodrag',
          noPanClassName,
          className,
          {
            output: !isInput,
            input: isInput,
            connectable: isConnectable,
            connectablestart: isConnectableStart,
            connectableend: isConnectableEnd,
            connecting: clickConnecting,
            // this class is used to style the pin when the user is connecting
            connectionindicator:
              isConnectable && ((isConnectableStart && !connecting) || (isConnectableEnd && connecting)),
          },
        ])}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onClick={connectOnClick ? onClick : undefined}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Pin.displayName = 'Pin';

export default memo(Pin);
