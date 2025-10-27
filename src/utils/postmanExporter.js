// Postman Collection v2.1 Exporter
export const exportToPostman = (apis, url, collectionName) => {
  const collection = {
    info: {
      name: collectionName || `API Collection - ${new URL(url).hostname}`,
      description: `Automatically generated from ${url}`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      _postman_id: generateUUID(),
      version: {
        major: 1,
        minor: 0,
        patch: 0
      }
    },
    item: [],
    variable: [],
    auth: null
  };

  // Group APIs by base path
  const grouped = groupByBasePath(apis);

  // Create folders for each group
  Object.entries(grouped).forEach(([basePath, groupApis]) => {
    const folder = {
      name: basePath || 'Root',
      item: groupApis.map(api => createPostmanRequest(api))
    };
    collection.item.push(folder);
  });

  // Extract common variables
  const commonHeaders = extractCommonHeaders(apis);
  if (commonHeaders.length > 0) {
    collection.variable = commonHeaders.map(header => ({
      key: header.key,
      value: header.value,
      type: "string"
    }));
  }

  // Detect common auth
  const commonAuth = detectCommonAuth(apis);
  if (commonAuth) {
    collection.auth = commonAuth;
  }

  return collection;
};

const createPostmanRequest = (api) => {
  const urlObj = new URL(api.url);
  
  const request = {
    name: `${api.method} ${urlObj.pathname}`,
    request: {
      method: api.method,
      header: [],
      url: {
        raw: api.url,
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname.split('.'),
        port: urlObj.port || '',
        path: urlObj.pathname.split('/').filter(Boolean),
        query: Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
          key,
          value,
          disabled: false
        }))
      }
    },
    response: []
  };

  // Add headers
  if (api.headers) {
    Object.entries(api.headers).forEach(([key, value]) => {
      // Skip pseudo-headers
      if (!key.startsWith(':')) {
        request.request.header.push({
          key,
          value,
          type: "text"
        });
      }
    });
  }

  // Add body for POST/PUT/PATCH
  if (api.payload && ['POST', 'PUT', 'PATCH'].includes(api.method)) {
    try {
      const parsed = JSON.parse(api.payload);
      request.request.body = {
        mode: "raw",
        raw: JSON.stringify(parsed, null, 2),
        options: {
          raw: {
            language: "json"
          }
        }
      };
    } catch {
      request.request.body = {
        mode: "raw",
        raw: api.payload
      };
    }
  }

  // Add example response
  if (api.response) {
    request.response.push({
      name: "Example Response",
      originalRequest: request.request,
      status: api.response.statusText || "OK",
      code: api.response.status,
      _postman_previewlanguage: "json",
      header: Object.entries(api.response.headers || {}).map(([key, value]) => ({
        key,
        value
      })),
      body: typeof api.response.data === 'string' 
        ? api.response.data 
        : JSON.stringify(api.response.data, null, 2)
    });
  }

  // Add description with explanations
  if (api.explanations && api.explanations.length > 0) {
    request.request.description = api.explanations.join('\n');
  }

  return request;
};

const groupByBasePath = (apis) => {
  const groups = {};
  
  apis.forEach(api => {
    try {
      const urlObj = new URL(api.url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const basePath = pathParts.length > 0 ? pathParts[0] : 'root';
      
      if (!groups[basePath]) {
        groups[basePath] = [];
      }
      groups[basePath].push(api);
    } catch {
      if (!groups['other']) {
        groups['other'] = [];
      }
      groups['other'].push(api);
    }
  });
  
  return groups;
};

const extractCommonHeaders = (apis) => {
  const headerCounts = {};
  
  apis.forEach(api => {
    if (api.headers) {
      Object.entries(api.headers).forEach(([key, value]) => {
        if (!key.startsWith(':')) {
          const headerKey = `${key}:${value}`;
          headerCounts[headerKey] = (headerCounts[headerKey] || 0) + 1;
        }
      });
    }
  });
  
  // Return headers that appear in more than 50% of requests
  const threshold = apis.length * 0.5;
  return Object.entries(headerCounts)
    .filter(([, count]) => count > threshold)
    .map(([headerKey]) => {
      const [key, value] = headerKey.split(':');
      return { key, value };
    });
};

const detectCommonAuth = (apis) => {
  const authTypes = apis
    .filter(api => api.authentication && api.authentication.length > 0)
    .map(api => api.authentication[0]);
  
  if (authTypes.length === 0) return null;
  
  const mostCommon = authTypes[0];
  
  if (mostCommon.type === 'Bearer Token') {
    return {
      type: "bearer",
      bearer: [{
        key: "token",
        value: "{{bearer_token}}",
        type: "string"
      }]
    };
  } else if (mostCommon.type === 'API Key') {
    return {
      type: "apikey",
      apikey: [{
        key: "key",
        value: mostCommon.header || "X-API-Key",
        type: "string"
      }, {
        key: "value",
        value: "{{api_key}}",
        type: "string"
      }]
    };
  } else if (mostCommon.type === 'Basic Auth') {
    return {
      type: "basic",
      basic: [{
        key: "username",
        value: "{{username}}",
        type: "string"
      }, {
        key: "password",
        value: "{{password}}",
        type: "string"
      }]
    };
  }
  
  return null;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const downloadPostmanCollection = (collection, filename) => {
  const blob = new Blob([JSON.stringify(collection, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'postman-collection.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
