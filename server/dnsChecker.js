import dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const setServers = dns.setServers;

// Popular public DNS servers
export const DNS_SERVERS = [
  { name: 'System Default', servers: null },
  { name: 'Google DNS', servers: ['8.8.8.8', '8.8.4.4'] },
  { name: 'Cloudflare DNS', servers: ['1.1.1.1', '1.0.0.1'] },
  { name: 'OpenDNS', servers: ['208.67.222.222', '208.67.220.220'] },
  { name: 'Quad9', servers: ['9.9.9.9', '149.112.112.112'] },
  { name: 'AdGuard DNS', servers: ['94.140.14.14', '94.140.15.15'] },
  { name: 'CleanBrowsing', servers: ['185.228.168.9', '185.228.169.9'] }
];

/**
 * Extract hostname from URL
 */
function getHostname(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Check if a hostname resolves with specific DNS servers
 */
async function checkDNSResolution(hostname, dnsServers = null) {
  const originalServers = dns.getServers();
  
  try {
    // Set custom DNS servers if provided
    if (dnsServers && dnsServers.length > 0) {
      dns.setServers(dnsServers);
    }
    
    // Try to resolve the hostname
    const addresses = await resolve4(hostname).catch(() => resolve6(hostname));
    
    return {
      success: true,
      addresses: addresses,
      message: `Resolved to ${addresses.join(', ')}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to resolve: ${error.message}`
    };
  } finally {
    // Restore original DNS servers
    if (dnsServers && dnsServers.length > 0) {
      dns.setServers(originalServers);
    }
  }
}

/**
 * Check if website is accessible via HTTP request
 */
async function checkWebsiteAccess(url, timeout = 10000) {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await axios.get(fullUrl, {
      timeout: timeout,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept any status < 500
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      message: `Website is accessible (HTTP ${response.status})`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: `Cannot access website: ${error.message}`
    };
  }
}

/**
 * Comprehensive DNS and access check with automatic fallback
 */
export async function checkWithDNSFallback(url) {
  const hostname = getHostname(url);
  const results = {
    url: url,
    hostname: hostname,
    checks: [],
    workingDNS: null,
    isBlocked: false,
    recommendation: null
  };

  console.log(`\n🔍 Checking DNS and access for: ${url}`);
  console.log(`📍 Hostname: ${hostname}\n`);

  // Test each DNS server
  for (const dnsConfig of DNS_SERVERS) {
    const checkStart = Date.now();
    console.log(`Testing with ${dnsConfig.name}...`);
    
    // DNS Resolution Check
    const dnsResult = await checkDNSResolution(hostname, dnsConfig.servers);
    
    // HTTP Access Check (only if DNS resolved)
    let accessResult = null;
    if (dnsResult.success) {
      accessResult = await checkWebsiteAccess(url);
    }
    
    const checkDuration = Date.now() - checkStart;
    
    const checkResult = {
      dnsProvider: dnsConfig.name,
      dnsServers: dnsConfig.servers || dns.getServers(),
      dnsResolution: dnsResult,
      httpAccess: accessResult,
      duration: checkDuration,
      working: dnsResult.success && (accessResult ? accessResult.success : false)
    };
    
    results.checks.push(checkResult);
    
    // If this DNS works and we haven't found a working one yet, mark it
    if (checkResult.working && !results.workingDNS) {
      results.workingDNS = dnsConfig;
      console.log(`✅ ${dnsConfig.name} works! (${checkDuration}ms)`);
    } else if (!checkResult.working) {
      console.log(`❌ ${dnsConfig.name} failed (${checkDuration}ms)`);
    }
  }

  // Analyze results
  const workingCount = results.checks.filter(c => c.working).length;
  const totalCount = results.checks.length;
  
  if (workingCount === 0) {
    results.isBlocked = true;
    results.recommendation = 'Website appears to be completely blocked or offline. None of the DNS servers could access it.';
  } else if (workingCount < totalCount) {
    results.isBlocked = true;
    results.recommendation = `DNS blocking detected! Use ${results.workingDNS.name} (${results.workingDNS.servers.join(', ')}) to access this website.`;
  } else {
    results.isBlocked = false;
    results.recommendation = 'Website is accessible with all DNS servers. No blocking detected.';
  }

  console.log(`\n📊 Summary: ${workingCount}/${totalCount} DNS servers can access the site`);
  console.log(`🎯 ${results.recommendation}\n`);

  return results;
}

/**
 * Quick check with a specific DNS server
 */
export async function quickDNSCheck(url, dnsServers) {
  const hostname = getHostname(url);
  const dnsResult = await checkDNSResolution(hostname, dnsServers);
  
  if (!dnsResult.success) {
    return {
      success: false,
      message: `DNS resolution failed with ${dnsServers.join(', ')}`,
      details: dnsResult
    };
  }
  
  const accessResult = await checkWebsiteAccess(url);
  
  return {
    success: accessResult.success,
    message: accessResult.message,
    dnsResult: dnsResult,
    accessResult: accessResult
  };
}

/**
 * Get current system DNS servers
 */
export function getCurrentDNS() {
  return {
    servers: dns.getServers(),
    message: `Current DNS servers: ${dns.getServers().join(', ')}`
  };
}
