import { useCallback } from 'react'

import { useStore } from '../hooks/useStore'
import { isEdgeVisible } from '../container/EdgeRenderer/utils'
import { internalsSymbol, isNumeric } from '../utils'
import type { ReactFlowState, NodeInternals, Edge } from '../types'

const defaultEdgeTree = [{ level: 0, isMaxLevel: true, edges: [] }]

function groupEdgesByZLevel(edges: Edge[], nodeInternals: NodeInternals, elevateEdgesOnSelect = false) {
  let maxLevel = -1

  const levelLookup = edges.reduce<Record<string, Edge[]>>((tree, edge) => {
    const hasZIndex = isNumeric(edge.zIndex)
    let z = hasZIndex ? edge.zIndex! : 0

    if (elevateEdgesOnSelect) {
      z = hasZIndex
        ? edge.zIndex!
        : Math.max(
          nodeInternals.get(edge.output)?.[internalsSymbol]?.z || 0,
          nodeInternals.get(edge.input)?.[internalsSymbol]?.z || 0
        )
    }

    if (tree[z]) {
      tree[z].push(edge)
    } else {
      tree[z] = [edge]
    }

    maxLevel = z > maxLevel ? z : maxLevel

    return tree
  }, {})

  const edgeTree = Object.entries(levelLookup).map(([key, edges]) => {
    const level = +key

    return {
      edges,
      level,
      isMaxLevel: level === maxLevel,
    }
  })

  if (edgeTree.length === 0) {
    return defaultEdgeTree
  }

  return edgeTree
}

function useVisibleEdges(onlyRenderVisible: boolean, nodeInternals: NodeInternals, elevateEdgesOnSelect: boolean) {
  const edges = useStore(
    useCallback(
      (s: ReactFlowState) => {
        if (!onlyRenderVisible) {
          return s.edges
        }

        return s.edges.filter((e) => {
          const outputNode = nodeInternals.get(e.output)
          const inputNode = nodeInternals.get(e.input)

          return (
            outputNode?.width &&
            outputNode?.height &&
            inputNode?.width &&
            inputNode?.height &&
            isEdgeVisible({
              outputPos: outputNode.positionAbsolute || { x: 0, y: 0 },
              inputPos: inputNode.positionAbsolute || { x: 0, y: 0 },
              outputWidth: outputNode.width,
              outputHeight: outputNode.height,
              inputWidth: inputNode.width,
              inputHeight: inputNode.height,
              width: s.width,
              height: s.height,
              transform: s.transform,
            })
          )
        })
      },
      [onlyRenderVisible, nodeInternals]
    )
  )

  return groupEdgesByZLevel(edges, nodeInternals, elevateEdgesOnSelect)
}

export default useVisibleEdges
