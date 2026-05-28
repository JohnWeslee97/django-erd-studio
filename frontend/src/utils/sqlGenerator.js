export function generateSQL(tableName, appName, fields) {
  const lines = [];
  const dbName = `${appName}_${tableName.toLowerCase()}`;
  
  lines.push(`-- SQL Preview for ${tableName} model`);
  lines.push(`CREATE TABLE "${dbName}" (`);
  
  const fieldLines = fields.map((f, idx) => {
    let type = 'VARCHAR(255)';
    let constraints = '';
    
    switch (f.type) {
      case 'AutoField':
        type = 'SERIAL';
        constraints = 'PRIMARY KEY';
        break;
      case 'BigAutoField':
        type = 'BIGSERIAL';
        constraints = 'PRIMARY KEY';
        break;
      case 'IntegerField':
        type = 'INTEGER';
        break;
      case 'FloatField':
        type = 'DOUBLE PRECISION';
        break;
      case 'DecimalField':
        type = 'NUMERIC(10, 2)';
        break;
      case 'BooleanField':
        type = 'BOOLEAN';
        break;
      case 'DateTimeField':
        type = 'TIMESTAMP WITH TIME ZONE';
        break;
      case 'DateField':
        type = 'DATE';
        break;
      case 'TextField':
        type = 'TEXT';
        break;
      case 'JSONField':
        type = 'JSONB';
        break;
      case 'ForeignKey':
        type = 'INTEGER';
        constraints = `REFERENCES "${f.related?.replace('.', '_').toLowerCase() || 'other_table'}" ("id") DEFERRABLE INITIALLY DEFERRED`;
        break;
      case 'OneToOneField':
        type = 'INTEGER';
        constraints = `UNIQUE REFERENCES "${f.related?.replace('.', '_').toLowerCase() || 'other_table'}" ("id") DEFERRABLE INITIALLY DEFERRED`;
        break;
      default:
        type = f.max_length ? `VARCHAR(${f.max_length})` : 'VARCHAR(255)';
    }

    if (!f.null && f.type !== 'AutoField' && f.type !== 'BigAutoField') {
      constraints += ' NOT NULL';
    }
    
    if (f.unique && f.type !== 'AutoField' && f.type !== 'BigAutoField' && f.type !== 'OneToOneField') {
      constraints += ' UNIQUE';
    }

    if (f.primary_key && f.type !== 'AutoField' && f.type !== 'BigAutoField') {
        constraints += ' PRIMARY KEY';
    }

    return `  "${f.name}" ${type}${constraints ? ' ' + constraints : ''}${idx === fields.length - 1 ? '' : ','}`;
  });

  lines.push(...fieldLines);
  lines.push(');');
  
  // ManyToMany tables
  fields.filter(f => f.type === 'ManyToManyField').forEach(f => {
    const m2mName = `${dbName}_${f.name}`;
    lines.push('\n-- M2M table for ' + f.name);
    lines.push(`CREATE TABLE "${m2mName}" (`);
    lines.push('  "id" SERIAL PRIMARY KEY,');
    lines.push(`  "${tableName.toLowerCase()}_id" INTEGER NOT NULL REFERENCES "${dbName}" ("id"),`);
    lines.push(`  "${f.related?.split('.').pop().toLowerCase() || 'target'}_id" INTEGER NOT NULL`);
    lines.push(');');
  });

  return lines.join('\n');
}
