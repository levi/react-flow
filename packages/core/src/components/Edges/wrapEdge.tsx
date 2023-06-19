import { memo, useState, useMemo, useRef } from 'react';
import type { ComponentType, KeyboardEvent } from 'react';
import cc from 'classcat';

import { useStoreApi } from '../../hooks/useStore';
import { ARIA_EDGE_DESC_KEY } from '../A11yDescriptions';
import { handlePointerDown } from '../Pin/handler';
import { EdgeAnchor } from './EdgeAnchor';
import { getMarkerId } from '../../utils/graph';
import { getMouseHandler } from './utils';
import { elementSelectionKeys } from '../../utils';
import type { EdgeProps, WrapEdgeProps, Connection } from '../../types';

const alwaysValidConnection = () => true;

export default (EdgeComponent: ComponentType<EdgeProps>) => {
  const EdgeWrapper = ({
    id,
    className,
    type,
    data,
    onClick,
    onEdgeDoubleClick,
    selected,
    animated,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    output,
    input,
    outputX,
    outputY,
    inputX,
    inputY,
    outputPosition,
    inputPosition,
    elementsSelectable,
    hidden,
    outputPinId,
    inputPinId,
    onContextMenu,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    edgeUpdaterRadius,
    onEdgeUpdate,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    markerEnd,
    markerStart,
    rfId,
    ariaLabel,
    isFocusable,
    isUpdatable,
    pathOptions,
    interactionWidth,
  }: WrapEdgeProps): JSX.Element | null => {
    const edgeRef = useRef<SVGGElement>(null);
    const [updateHover, setUpdateHover] = useState<boolean>(false);
    const [updating, setUpdating] = useState<boolean>(false);
    const store = useStoreApi();

    const markerStartUrl = useMemo(() => `url(#${getMarkerId(markerStart, rfId)})`, [markerStart, rfId]);
    const markerEndUrl = useMemo(() => `url(#${getMarkerId(markerEnd, rfId)})`, [markerEnd, rfId]);

    if (hidden) {
      return null;
    }

    const onEdgeClick = (event: React.MouseEvent<SVGGElement, MouseEvent>): void => {
      const { edges, addSelectedEdges } = store.getState();

      if (elementsSelectable) {
        store.setState({ nodesSelectionActive: false });
        addSelectedEdges([id]);
      }

      if (onClick) {
        const edge = edges.find((e) => e.id === id)!;
        onClick(event, edge);
      }
    };

    const onEdgeDoubleClickHandler = getMouseHandler(id, store.getState, onEdgeDoubleClick);
    const onEdgeContextMenu = getMouseHandler(id, store.getState, onContextMenu);
    const onEdgeMouseEnter = getMouseHandler(id, store.getState, onMouseEnter);
    const onEdgeMouseMove = getMouseHandler(id, store.getState, onMouseMove);
    const onEdgeMouseLeave = getMouseHandler(id, store.getState, onMouseLeave);

    const handleEdgeUpdater = (event: React.MouseEvent<SVGGElement, MouseEvent>, isInputPin: boolean) => {
      // avoid triggering edge updater if mouse btn is not left
      if (event.button !== 0) {
        return;
      }

      const { edges, isValidConnection: isValidConnectionStore } = store.getState();
      const nodeId = isInputPin ? input : output;
      const pinId = (isInputPin ? inputPinId : outputPinId) || null;
      const pinType = isInputPin ? 'input' : 'output';
      const isValidConnection = isValidConnectionStore || alwaysValidConnection;

      const isInput = isInputPin;
      const edge = edges.find((e) => e.id === id)!;

      setUpdating(true);
      onEdgeUpdateStart?.(event, edge, pinType);

      const _onEdgeUpdateEnd = (evt: MouseEvent | TouchEvent) => {
        setUpdating(false);
        onEdgeUpdateEnd?.(evt, edge, pinType);
      };

      const onConnectEdge = (connection: Connection) => onEdgeUpdate?.(edge, connection);

      handlePointerDown({
        event,
        pinId,
        nodeId,
        onConnect: onConnectEdge,
        isInput,
        getState: store.getState,
        setState: store.setState,
        isValidConnection,
        edgeUpdaterType: pinType,
        onEdgeUpdateEnd: _onEdgeUpdateEnd,
      });
    };

    const onEdgeUpdaterOutputMouseDown = (event: React.MouseEvent<SVGGElement, MouseEvent>): void =>
      handleEdgeUpdater(event, true);
    const onEdgeUpdaterInputMouseDown = (event: React.MouseEvent<SVGGElement, MouseEvent>): void =>
      handleEdgeUpdater(event, false);

    const onEdgeUpdaterMouseEnter = () => setUpdateHover(true);
    const onEdgeUpdaterMouseOut = () => setUpdateHover(false);

    const inactive = !elementsSelectable && !onClick;

    const onKeyDown = (event: KeyboardEvent) => {
      if (elementSelectionKeys.includes(event.key) && elementsSelectable) {
        const { unselectNodesAndEdges, addSelectedEdges, edges } = store.getState();
        const unselect = event.key === 'Escape';

        if (unselect) {
          edgeRef.current?.blur();
          unselectNodesAndEdges({ edges: [edges.find((e) => e.id === id)!] });
        } else {
          addSelectedEdges([id]);
        }
      }
    };

    return (
      <g
        className={cc([
          'react-flow__edge',
          `react-flow__edge-${type}`,
          className,
          { selected, animated, inactive, updating: updateHover },
        ])}
        onClick={onEdgeClick}
        onDoubleClick={onEdgeDoubleClickHandler}
        onContextMenu={onEdgeContextMenu}
        onMouseEnter={onEdgeMouseEnter}
        onMouseMove={onEdgeMouseMove}
        onMouseLeave={onEdgeMouseLeave}
        onKeyDown={isFocusable ? onKeyDown : undefined}
        tabIndex={isFocusable ? 0 : undefined}
        role={isFocusable ? 'button' : undefined}
        data-testid={`rf__edge-${id}`}
        aria-label={ariaLabel === null ? undefined : ariaLabel ? ariaLabel : `Edge from ${output} to ${input}`}
        aria-describedby={isFocusable ? `${ARIA_EDGE_DESC_KEY}-${rfId}` : undefined}
        ref={edgeRef}
      >
        {!updating && (
          <EdgeComponent
            id={id}
            output={output}
            input={input}
            selected={selected}
            animated={animated}
            label={label}
            labelStyle={labelStyle}
            labelShowBg={labelShowBg}
            labelBgStyle={labelBgStyle}
            labelBgPadding={labelBgPadding}
            labelBgBorderRadius={labelBgBorderRadius}
            data={data}
            style={style}
            outputX={outputX}
            outputY={outputY}
            inputX={inputX}
            inputY={inputY}
            outputPosition={outputPosition}
            inputPosition={inputPosition}
            outputPinId={outputPinId}
            inputPinId={inputPinId}
            markerStart={markerStartUrl}
            markerEnd={markerEndUrl}
            pathOptions={pathOptions}
            interactionWidth={interactionWidth}
          />
        )}
        {isUpdatable && (
          <>
            {(isUpdatable === 'output' || isUpdatable === true) && (
              <EdgeAnchor
                position={outputPosition}
                centerX={outputX}
                centerY={outputY}
                radius={edgeUpdaterRadius}
                onMouseDown={onEdgeUpdaterOutputMouseDown}
                onMouseEnter={onEdgeUpdaterMouseEnter}
                onMouseOut={onEdgeUpdaterMouseOut}
                type="output"
              />
            )}
            {(isUpdatable === 'input' || isUpdatable === true) && (
              <EdgeAnchor
                position={inputPosition}
                centerX={inputX}
                centerY={inputY}
                radius={edgeUpdaterRadius}
                onMouseDown={onEdgeUpdaterInputMouseDown}
                onMouseEnter={onEdgeUpdaterMouseEnter}
                onMouseOut={onEdgeUpdaterMouseOut}
                type="input"
              />
            )}
          </>
        )}
      </g>
    );
  };

  EdgeWrapper.displayName = 'EdgeWrapper';

  return memo(EdgeWrapper);
};
