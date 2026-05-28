import { MarkerType } from 'reactflow';

/**
 * Converts the Django schema JSON into React Flow Nodes and Edges
 * @param {Object} schema - The introspected Django schema
 * @returns {Object} { nodes, edges }
 */
export function generateGraphData(schema) {
  const nodes = [];
  const edges = [];
  
  if (!schema) return { nodes, edges };

  Object.keys(schema).forEach((modelId, index) => {
    const model = schema[modelId];
    
    // Initial dummy position, will be corrected by layout utility
    const x = 0;
    const y = 0;

    nodes.push({
      id: modelId,
      type: 'tableNode',
      position: { x, y },
      data: {
        name: model.name || modelId,
        app: model.app_label || model.app,
        table: model.db_table || model.table,
        fields: model.fields || []
      }
    });

    // Create edges for relationships
    if (model.fields) {
      model.fields.forEach(field => {
        const relatedModel = field.related_model || field.related;
        
        if (relatedModel && schema[relatedModel]) {
          let label = '';
          let stroke = '#9ca3af'; 
          let animated = false;
          let strokeDasharray = undefined;

          // Relationship styling based on type
          if (field.type === 'ForeignKey') {
            label = '1:N';
          } else if (field.type === 'OneToOneField') {
            label = '1:1';
            stroke = '#10b981'; // green
          } else if (field.type === 'ManyToManyField') {
            label = 'M:N';
            animated = true;
            strokeDasharray = '5 5';
          }

          const relatedSchema = schema[relatedModel];
          const pkField = relatedSchema?.fields?.find(f => f.primary_key || f.pk);
          const sourceHandleId = pkField ? pkField.name : 'id';

          edges.push({
            id: `e-${modelId}-${field.name}-${relatedModel}`,
            source: relatedModel,
            target: modelId,
            sourceHandle: sourceHandleId,
            targetHandle: field.name,
            type: 'interactiveEdge',
            animated,
            style: { stroke, strokeWidth: 2, strokeDasharray },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: stroke,
            },
            data: {
              label,
              sourceField: sourceHandleId,
              targetField: field.name,
              sourceTable: schema[relatedModel]?.name || relatedModel.split('.').pop(),
              targetTable: model.name || modelId.split('.').pop(),
              relType: label,
              relatedName: field.related_name || null,
              stroke,
              // onEdgeClick will be injected by ERDiagram
            },
          });
        }
      });
    }
  });

  return { nodes, edges };
}
