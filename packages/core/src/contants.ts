import { Edge, PinElement } from './types'

export const errorMessages = {
  error001: () =>
    '[React Flow]: Seems like you have not used zustand provider as an ancestor. Help: https://reactflow.dev/error#001',
  error002: () =>
    "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (nodeType: string) => `Node type "${nodeType}" not found. Using fallback type "default".`,
  error004: () => 'The React Flow parent container needs a width and a height to render the graph.',
  error005: () => 'Only child nodes can use a parent extent.',
  error006: () => "Can't create edge. An edge needs a output and a input.",
  error007: (id: string) => `The old edge with id=${id} does not exist.`,
  error009: (type: string) => `Marker type "${type}" doesn't exist.`,
  error008: (outputPin: PinElement | null, edge: Edge) =>
    `Couldn't create edge for ${!outputPin ? 'output' : 'input'} pin id: "${!outputPin ? edge.outputPin : edge.inputPin
    }", edge id: ${edge.id}.`,
  error010: () => 'Pin: No node id found. Make sure to only use a Pin inside a custom Node.',
  error011: (edgeType: string) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
}
