/**
 * Proxy Manager for handling proxy rotation and validation
 */
export class ProxyManager {
  constructor() {
    // Free proxy list (you can add more or integrate with paid proxy services)
    this.proxies = [
      // Add your proxies here in format: protocol://ip:port
      // Example: 'http://proxy1.example.com:8080'
    ];
    
    this.workingProxies = [];
    this.failedProxies = [];
  }

  /**
   * Add a proxy to the list
   */
  addProxy(proxy) {
    if (!this.proxies.includes(proxy)) {
      this.proxies.push(proxy);
    }
  }

  /**
   * Add multiple proxies
   */
  addProxies(proxies) {
    proxies.forEach(proxy => this.addProxy(proxy));
  }

  /**
   * Get next available proxy
   */
  getNextProxy() {
    if (this.workingProxies.length > 0) {
      // Rotate through working proxies
      const proxy = this.workingProxies.shift();
      this.workingProxies.push(proxy);
      return proxy;
    }
    
    // Try untested proxies
    if (this.proxies.length > 0) {
      return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    }
    
    return null;
  }

  /**
   * Mark proxy as working
   */
  markAsWorking(proxy) {
    if (!this.workingProxies.includes(proxy)) {
      this.workingProxies.push(proxy);
    }
    // Remove from failed if it was there
    this.failedProxies = this.failedProxies.filter(p => p !== proxy);
  }

  /**
   * Mark proxy as failed
   */
  markAsFailed(proxy) {
    if (!this.failedProxies.includes(proxy)) {
      this.failedProxies.push(proxy);
    }
    // Remove from working if it was there
    this.workingProxies = this.workingProxies.filter(p => p !== proxy);
  }

  /**
   * Get all proxies
   */
  getAllProxies() {
    return {
      total: this.proxies.length,
      working: this.workingProxies,
      failed: this.failedProxies
    };
  }

  /**
   * Clear failed proxies list
   */
  clearFailed() {
    this.failedProxies = [];
  }

  /**
   * Test a proxy
   */
  async testProxy(proxy, testUrl = 'https://api.ipify.org?format=json') {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(testUrl, {
        proxy: this.parseProxy(proxy),
        timeout: 10000
      });
      
      if (response.status === 200) {
        this.markAsWorking(proxy);
        return {
          working: true,
          proxy,
          ip: response.data?.ip
        };
      }
    } catch (error) {
      this.markAsFailed(proxy);
    }
    
    return {
      working: false,
      proxy
    };
  }

  /**
   * Parse proxy string to object
   */
  parseProxy(proxyString) {
    try {
      const url = new URL(proxyString);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: parseInt(url.port),
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password
        } : undefined
      };
    } catch {
      return null;
    }
  }
}

export default ProxyManager;
