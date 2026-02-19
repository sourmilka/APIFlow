/**
 * Code Generation Utilities — Generate executable code snippets for discovered APIs
 * Supports: cURL, JavaScript fetch, Python requests, Node.js axios, WebSocket
 */

export function generateCurl(api) {
  const parts = ['curl'];
  if (api.method !== 'GET') parts.push(`-X ${api.method}`);
  parts.push(`'${api.url}'`);
  
  // Headers
  if (api.headers) {
    const skip = ['host', 'connection', 'content-length', 'accept-encoding', 'cache-control', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'upgrade-insecure-requests'];
    Object.entries(api.headers).forEach(([key, value]) => {
      if (!skip.includes(key.toLowerCase())) {
        parts.push(`-H '${key}: ${value}'`);
      }
    });
  }
  
  // Body
  if (api.payload) {
    const body = typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload);
    parts.push(`-d '${body.replace(/'/g, "'\\''")}'`);
  }
  
  return parts.join(' \\\n  ');
}

export function generateJavaScriptFetch(api) {
  const options = { method: api.method };
  
  // Headers
  const headers = {};
  if (api.headers) {
    const include = ['authorization', 'content-type', 'accept', 'x-api-key', 'x-auth-token', 'x-csrf-token', 'cookie'];
    Object.entries(api.headers).forEach(([key, value]) => {
      if (include.includes(key.toLowerCase())) headers[key] = value;
    });
  }
  
  let code = `const response = await fetch('${api.url}'`;
  
  const hasOptions = api.method !== 'GET' || Object.keys(headers).length > 0 || api.payload;
  if (hasOptions) {
    code += `, {\n  method: '${api.method}'`;
    if (Object.keys(headers).length > 0) {
      code += `,\n  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`;
    }
    if (api.payload) {
      const body = typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload, null, 2);
      code += `,\n  body: JSON.stringify(${body})`;
    }
    code += `\n}`;
  }
  code += `);\n\nconst data = await response.json();\nconsole.log(data);`;
  
  return code;
}

export function generatePythonRequests(api) {
  let code = `import requests\n\n`;
  const method = api.method.toLowerCase();
  
  code += `url = "${api.url}"\n\n`;
  
  // Headers
  const headers = {};
  if (api.headers) {
    const include = ['authorization', 'content-type', 'accept', 'x-api-key', 'x-auth-token', 'cookie'];
    Object.entries(api.headers).forEach(([key, value]) => {
      if (include.includes(key.toLowerCase())) headers[key] = value;
    });
  }
  
  if (Object.keys(headers).length > 0) {
    code += `headers = ${JSON.stringify(headers, null, 4).replace(/"/g, '"')}\n\n`;
  }
  
  if (api.payload) {
    const payload = typeof api.payload === 'string' ? api.payload : JSON.stringify(api.payload, null, 4);
    code += `payload = ${payload}\n\n`;
  }
  
  code += `response = requests.${method}(url`;
  if (Object.keys(headers).length > 0) code += `, headers=headers`;
  if (api.payload) code += `, json=payload`;
  code += `)\n\n`;
  
  code += `print(response.status_code)\nprint(response.json())`;
  
  return code;
}

export function generateNodeAxios(api) {
  const method = api.method.toLowerCase();
  let code = `const axios = require('axios');\n\n`;
  
  // Headers
  const headers = {};
  if (api.headers) {
    const include = ['authorization', 'content-type', 'accept', 'x-api-key', 'x-auth-token', 'cookie'];
    Object.entries(api.headers).forEach(([key, value]) => {
      if (include.includes(key.toLowerCase())) headers[key] = value;
    });
  }
  
  const config = {};
  if (Object.keys(headers).length > 0) config.headers = headers;
  
  if (['get', 'delete', 'head', 'options'].includes(method)) {
    code += `const { data } = await axios.${method}('${api.url}'`;
    if (Object.keys(config).length > 0) {
      code += `, ${JSON.stringify(config, null, 2)}`;
    }
    code += `);\n\nconsole.log(data);`;
  } else {
    const body = api.payload ? (typeof api.payload === 'string' ? JSON.parse(api.payload) : api.payload) : {};
    code += `const { data } = await axios.${method}('${api.url}', ${JSON.stringify(body, null, 2)}`;
    if (Object.keys(config).length > 0) {
      code += `, ${JSON.stringify(config, null, 2)}`;
    }
    code += `);\n\nconsole.log(data);`;
  }
  
  return code;
}

export function generateWebSocketClient(ws) {
  return `// WebSocket Connection
const ws = new WebSocket('${ws.url}');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  // Send a message
  // ws.send(JSON.stringify({ type: 'subscribe', channel: 'data' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};`;
}

export function generatePythonWebSocket(ws) {
  return `import asyncio
import websockets
import json

async def connect():
    async with websockets.connect("${ws.url}") as ws:
        # Send a message
        # await ws.send(json.dumps({"type": "subscribe"}))
        
        while True:
            message = await ws.recv()
            data = json.loads(message)
            print("Received:", data)

asyncio.run(connect())`;
}

export function generateSSEClient(sse) {
  return `// Server-Sent Events Connection
const eventSource = new EventSource('${sse.url}');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};

// Listen for specific event types
// eventSource.addEventListener('update', (event) => {
//   console.log('Update:', JSON.parse(event.data));
// });`;
}

export const CODE_LANGUAGES = [
  { id: 'curl', name: 'cURL', icon: '⌘', generator: generateCurl },
  { id: 'javascript', name: 'JavaScript', icon: 'JS', generator: generateJavaScriptFetch },
  { id: 'python', name: 'Python', icon: '🐍', generator: generatePythonRequests },
  { id: 'nodejs', name: 'Node.js', icon: '⬢', generator: generateNodeAxios },
];

export const WS_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS', generator: generateWebSocketClient },
  { id: 'python', name: 'Python', icon: '🐍', generator: generatePythonWebSocket },
];
