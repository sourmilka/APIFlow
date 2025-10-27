import { checkWithDNSFallback, quickDNSCheck } from './server/dnsChecker.js';

// Test the blocked website with all DNS providers
async function testGeMovie() {
  console.log('='.repeat(60));
  console.log('Testing https://ge.movie/ with DNS fallback detection');
  console.log('='.repeat(60));
  
  try {
    const results = await checkWithDNSFallback('https://ge.movie/');
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('==================');
    console.log(`Hostname: ${results.hostname}`);
    console.log(`Is Blocked: ${results.isBlocked}`);
    console.log(`Working DNS: ${results.workingDNS?.name || 'None'}`);
    console.log(`Recommendation: ${results.recommendation}`);
    
    console.log('\n🔍 DETAILED CHECK RESULTS:');
    console.log('============================');
    results.checks.forEach((check, index) => {
      console.log(`\n${index + 1}. ${check.dnsProvider}`);
      console.log(`   Servers: ${check.dnsServers.join(', ')}`);
      console.log(`   Status: ${check.working ? '✅ WORKING' : '❌ FAILED'}`);
      console.log(`   DNS Resolution: ${check.dnsResolution.success ? '✅' : '❌'} ${check.dnsResolution.message}`);
      if (check.httpAccess) {
        console.log(`   HTTP Access: ${check.httpAccess.success ? '✅' : '❌'} ${check.httpAccess.message}`);
      }
      console.log(`   Duration: ${check.duration}ms`);
    });
    
    console.log('\n='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during DNS test:', error.message);
    console.error(error);
  }
}

// Test specifically with Cloudflare DNS
async function testWithCloudflare() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing https://ge.movie/ specifically with Cloudflare DNS');
  console.log('='.repeat(60));
  
  try {
    const cloudflareDNS = ['1.1.1.1', '1.0.0.1'];
    const result = await quickDNSCheck('https://ge.movie/', cloudflareDNS);
    
    console.log('\n🌐 CLOUDFLARE DNS TEST:');
    console.log('========================');
    console.log(`DNS Servers: ${cloudflareDNS.join(', ')}`);
    console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`Message: ${result.message}`);
    
    if (result.dnsResult) {
      console.log(`\nDNS Resolution:`);
      console.log(`  Success: ${result.dnsResult.success ? '✅' : '❌'}`);
      console.log(`  ${result.dnsResult.message}`);
      if (result.dnsResult.addresses) {
        console.log(`  IP Addresses: ${result.dnsResult.addresses.join(', ')}`);
      }
    }
    
    if (result.accessResult) {
      console.log(`\nHTTP Access:`);
      console.log(`  Success: ${result.accessResult.success ? '✅' : '❌'}`);
      console.log(`  ${result.accessResult.message}`);
      if (result.accessResult.status) {
        console.log(`  Status Code: ${result.accessResult.status}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during Cloudflare DNS test:', error.message);
    console.error(error);
  }
}

// Run both tests
async function runTests() {
  await testGeMovie();
  await testWithCloudflare();
  
  console.log('\n✅ All DNS tests completed!\n');
}

runTests();
