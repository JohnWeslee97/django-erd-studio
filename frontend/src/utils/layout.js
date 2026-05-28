import dagre from 'dagre';

const nodeWidth = 300;

/**
 * Estimates the rendered height of a table node based on its field count.
 * Header ~44px + each field row ~37px + padding ~16px
 */
const estimateNodeHeight = (node) => {
  const fieldCount = node?.data?.fields?.length || 2;
  return 44 + (fieldCount * 37) + 16;
};

/**
 * Applies a Dagre layout to the provided nodes and edges.
 * Uses estimated node heights so Dagre reserves accurate space for each table,
 * preventing headers and footers from being cut off by fitView.
 *
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {string} direction - 'LR' (Left to Right) or 'TB' (Top to Bottom)
 * @returns {Object} { nodes, edges } with updated positions
 */
export const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,   // vertical gap between sibling nodes
    ranksep: 100,  // horizontal gap between ranks (columns in LR)
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const h = estimateNodeHeight(node);
    dagreGraph.setNode(node.id, { width: nodeWidth, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    const h = estimateNodeHeight(node);

    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
