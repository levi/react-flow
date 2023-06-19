import { memo, ReactNode } from 'react';
import { shallow } from 'zustand/shallow';
import cc from 'classcat';

import { useStore } from '../../hooks/useStore';
import useVisibleEdges from '../../hooks/useVisibleEdges';
import MarkerDefinitions from './MarkerDefinitions';
import { getEdgePositions, getPin, getNodeData } from './utils';

import { GraphViewProps } from '../GraphView';
import { ConnectionMode, Position } from '../../types';
import type { Edge, ReactFlowState } from '../../types';
import { errorMessages } from '../../contants';

type EdgeRendererProps = Pick<
  GraphViewProps,
  | 'edgeTypes'
  | 'onEdgeClick'
  | 'onEdgeDoubleClick'
  | 'defaultMarkerColor'
  | 'onlyRenderVisibleElements'
  | 'onEdgeUpdate'
  | 'onEdgeContextMenu'
  | 'onEdgeMouseEnter'
  | 'onEdgeMouseMove'
  | 'onEdgeMouseLeave'
  | 'onEdgeUpdateStart'
  | 'onEdgeUpdateEnd'
  | 'edgeUpdaterRadius'
  | 'noPanClassName'
  | 'elevateEdgesOnSelect'
  | 'rfId'
  | 'disableKeyboardA11y'
> & {
  elevateEdgesOnSelect: boolean;
  children: ReactNode;
};

const selector = (s: ReactFlowState) => ({
  nodesConnectable: s.nodesConnectable,
  edgesFocusable: s.edgesFocusable,
  edgesUpdatable: s.edgesUpdatable,
  elementsSelectable: s.elementsSelectable,
  width: s.width,
  height: s.height,
  connectionMode: s.connectionMode,
  nodeInternals: s.nodeInternals,
  onError: s.onError,
});

const EdgeRenderer = ({
  defaultMarkerColor,
  onlyRenderVisibleElements,
  elevateEdgesOnSelect,
  rfId,
  edgeTypes,
  noPanClassName,
  onEdgeUpdate,
  onEdgeContextMenu,
  onEdgeMouseEnter,
  onEdgeMouseMove,
  onEdgeMouseLeave,
  onEdgeClick,
  edgeUpdaterRadius,
  onEdgeDoubleClick,
  onEdgeUpdateStart,
  onEdgeUpdateEnd,
  children,
}: EdgeRendererProps) => {
  const { edgesFocusable, edgesUpdatable, elementsSelectable, width, height, connectionMode, nodeInternals, onError } =
    useStore(selector, shallow);
  const edgeTree = useVisibleEdges(onlyRenderVisibleElements, nodeInternals, elevateEdgesOnSelect);

  if (!width) {
    return null;
  }

  return (
    <>
      {edgeTree.map(({ level, edges, isMaxLevel }) => (
        <svg
          key={level}
          style={{ zIndex: level }}
          width={width}
          height={height}
          className="react-flow__edges react-flow__container"
        >
          {isMaxLevel && <MarkerDefinitions defaultColor={defaultMarkerColor} rfId={rfId} />}
          <g>
            {edges.map((edge: Edge) => {
              const [outputNodeRect, outputPinBounds, outputIsValid] = getNodeData(nodeInternals.get(edge.output));
              const [inputNodeRect, inputPinBounds, inputIsValid] = getNodeData(nodeInternals.get(edge.input));

              if (!outputIsValid || !inputIsValid) {
                return null;
              }

              let edgeType = edge.type || 'default';

              if (!edgeTypes[edgeType]) {
                onError?.('011', errorMessages['error011'](edgeType));
                edgeType = 'default';
              }

              const EdgeComponent = edgeTypes[edgeType] || edgeTypes.default;
              // when connection type is loose we can define all pins as outputs and connect output -> output
              const inputNodePins =
                connectionMode === ConnectionMode.Strict
                  ? inputPinBounds!.input
                  : (inputPinBounds!.input ?? []).concat(inputPinBounds!.output ?? []);
              const outputPin = getPin(outputPinBounds!.output!, edge.outputPin);
              const inputPin = getPin(inputNodePins!, edge.inputPin);
              const outputPosition = outputPin?.position || Position.Bottom;
              const inputPosition = inputPin?.position || Position.Top;
              const isFocusable = !!(edge.focusable || (edgesFocusable && typeof edge.focusable === 'undefined'));
              const isUpdatable =
                typeof onEdgeUpdate !== 'undefined' &&
                (edge.updatable || (edgesUpdatable && typeof edge.updatable === 'undefined'));

              if (!outputPin || !inputPin) {
                onError?.('008', errorMessages['error008'](outputPin, edge));

                return null;
              }

              const { outputX, outputY, inputX, inputY } = getEdgePositions(
                outputNodeRect,
                outputPin,
                outputPosition,
                inputNodeRect,
                inputPin,
                inputPosition
              );

              return (
                <EdgeComponent
                  key={edge.id}
                  id={edge.id}
                  className={cc([edge.className, noPanClassName])}
                  type={edgeType}
                  data={edge.data}
                  selected={!!edge.selected}
                  animated={!!edge.animated}
                  hidden={!!edge.hidden}
                  label={edge.label}
                  labelStyle={edge.labelStyle}
                  labelShowBg={edge.labelShowBg}
                  labelBgStyle={edge.labelBgStyle}
                  labelBgPadding={edge.labelBgPadding}
                  labelBgBorderRadius={edge.labelBgBorderRadius}
                  style={edge.style}
                  output={edge.output}
                  input={edge.input}
                  outputPinId={edge.outputPin}
                  inputPinId={edge.inputPin}
                  markerEnd={edge.markerEnd}
                  markerStart={edge.markerStart}
                  outputX={outputX}
                  outputY={outputY}
                  inputX={inputX}
                  inputY={inputY}
                  outputPosition={outputPosition}
                  inputPosition={inputPosition}
                  elementsSelectable={elementsSelectable}
                  onEdgeUpdate={onEdgeUpdate}
                  onContextMenu={onEdgeContextMenu}
                  onMouseEnter={onEdgeMouseEnter}
                  onMouseMove={onEdgeMouseMove}
                  onMouseLeave={onEdgeMouseLeave}
                  onClick={onEdgeClick}
                  edgeUpdaterRadius={edgeUpdaterRadius}
                  onEdgeDoubleClick={onEdgeDoubleClick}
                  onEdgeUpdateStart={onEdgeUpdateStart}
                  onEdgeUpdateEnd={onEdgeUpdateEnd}
                  rfId={rfId}
                  ariaLabel={edge.ariaLabel}
                  isFocusable={isFocusable}
                  isUpdatable={isUpdatable}
                  pathOptions={'pathOptions' in edge ? edge.pathOptions : undefined}
                  interactionWidth={edge.interactionWidth}
                />
              );
            })}
          </g>
        </svg>
      ))}
      {children}
    </>
  );
};

EdgeRenderer.displayName = 'EdgeRenderer';

export default memo(EdgeRenderer);
