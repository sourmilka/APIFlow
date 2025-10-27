// Infer JSON Schema from API responses
export const inferSchema = (data, name = 'Root') => {
  if (data === null) {
    return { type: 'null' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        type: 'array',
        items: { type: 'unknown' }
      };
    }
    
    // Infer from first few items
    const samples = data.slice(0, 5);
    const itemSchemas = samples.map(item => inferSchema(item));
    
    // Merge schemas
    const mergedSchema = mergeSchemas(itemSchemas);
    
    return {
      type: 'array',
      items: mergedSchema,
      minItems: data.length,
      maxItems: data.length
    };
  }

  if (typeof data === 'object') {
    const properties = {};
    const required = [];
    
    Object.entries(data).forEach(([key, value]) => {
      properties[key] = inferSchema(value, key);
      if (value !== null && value !== undefined) {
        required.push(key);
      }
    });
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  // Primitive types
  const type = typeof data;
  
  if (type === 'string') {
    const schema = { type: 'string' };
    
    // Detect formats
    if (isEmail(data)) schema.format = 'email';
    else if (isURL(data)) schema.format = 'uri';
    else if (isDate(data)) schema.format = 'date-time';
    else if (isUUID(data)) schema.format = 'uuid';
    
    schema.example = data;
    return schema;
  }

  if (type === 'number') {
    return {
      type: Number.isInteger(data) ? 'integer' : 'number',
      example: data
    };
  }

  if (type === 'boolean') {
    return {
      type: 'boolean',
      example: data
    };
  }

  return { type };
};

const mergeSchemas = (schemas) => {
  if (schemas.length === 0) return { type: 'unknown' };
  if (schemas.length === 1) return schemas[0];
  
  // If all same type, merge properties
  const types = [...new Set(schemas.map(s => s.type))];
  
  if (types.length === 1 && types[0] === 'object') {
    const allProperties = {};
    const allRequired = new Set();
    
    schemas.forEach(schema => {
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, value]) => {
          if (!allProperties[key]) {
            allProperties[key] = value;
          } else {
            allProperties[key] = mergeSchemas([allProperties[key], value]);
          }
        });
      }
      
      if (schema.required) {
        schema.required.forEach(key => allRequired.add(key));
      }
    });
    
    return {
      type: 'object',
      properties: allProperties,
      required: allRequired.size > 0 ? Array.from(allRequired) : undefined
    };
  }
  
  // Different types - use oneOf
  return {
    oneOf: schemas
  };
};

// Format detection helpers
const isEmail = (str) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
};

const isURL = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const isDate = (str) => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
};

const isUUID = (str) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Generate TypeScript interface from schema
export const generateTypeScript = (schema, name = 'Response') => {
  if (!schema) return '';
  
  if (schema.type === 'object') {
    const properties = schema.properties || {};
    const required = new Set(schema.required || []);
    
    const fields = Object.entries(properties).map(([key, value]) => {
      const optional = !required.has(key) ? '?' : '';
      const type = schemaToTSType(value);
      return `  ${key}${optional}: ${type};`;
    }).join('\n');
    
    return `interface ${name} {\n${fields}\n}`;
  }
  
  if (schema.type === 'array') {
    const itemType = schemaToTSType(schema.items);
    return `type ${name} = ${itemType}[];`;
  }
  
  return `type ${name} = ${schemaToTSType(schema)};`;
};

const schemaToTSType = (schema) => {
  if (!schema) return 'unknown';
  
  if (schema.oneOf) {
    return schema.oneOf.map(s => schemaToTSType(s)).join(' | ');
  }
  
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      return `${schemaToTSType(schema.items)}[]`;
    case 'object':
      if (!schema.properties) return 'object';
      const props = Object.entries(schema.properties).map(([key, value]) => {
        const optional = !schema.required?.includes(key) ? '?' : '';
        return `${key}${optional}: ${schemaToTSType(value)}`;
      }).join('; ');
      return `{ ${props} }`;
    default:
      return 'unknown';
  }
};

// Analyze response data
export const analyzeResponse = (data) => {
  const analysis = {
    type: Array.isArray(data) ? 'array' : typeof data,
    size: JSON.stringify(data).length,
    fields: 0,
    depth: 0,
    nullFields: [],
    arrayFields: [],
    objectFields: []
  };
  
  const analyze = (obj, path = '', depth = 0) => {
    if (depth > analysis.depth) analysis.depth = depth;
    
    if (obj === null || obj === undefined) {
      analysis.nullFields.push(path);
      return;
    }
    
    if (Array.isArray(obj)) {
      analysis.arrayFields.push(path);
      if (obj.length > 0) {
        analyze(obj[0], `${path}[0]`, depth + 1);
      }
      return;
    }
    
    if (typeof obj === 'object') {
      analysis.objectFields.push(path);
      Object.entries(obj).forEach(([key, value]) => {
        analysis.fields++;
        analyze(value, path ? `${path}.${key}` : key, depth + 1);
      });
    }
  };
  
  analyze(data);
  
  return analysis;
};
