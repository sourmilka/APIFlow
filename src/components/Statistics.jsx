import { useMemo, memo } from 'react';
import { Activity, CheckCircle, XCircle, Clock, TrendingUp, Zap, Database } from 'lucide-react';
import DashboardWidget from './DashboardWidget';

// Helper functions for sparkline data calculations
const calculateResponseTimeSparkline = (apis) => {
  const apisWithTime = apis
    .filter(api => api.response?.responseTime)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-20);
  
  return apisWithTime.map(api => api.response.responseTime);
};

const calculateRequestFrequencySparkline = (apis) => {
  if (apis.length === 0) return [];
  
  const sortedApis = [...apis].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const firstTime = new Date(sortedApis[0].timestamp).getTime();
  const lastTime = new Date(sortedApis[sortedApis.length - 1].timestamp).getTime();
  const timeSpan = lastTime - firstTime;
  
  if (timeSpan === 0) return [apis.length];
  
  // Create 10 time buckets
  const bucketCount = 10;
  const bucketSize = timeSpan / bucketCount;
  const buckets = new Array(bucketCount).fill(0);
  
  sortedApis.forEach(api => {
    const apiTime = new Date(api.timestamp).getTime();
    const bucketIndex = Math.min(Math.floor((apiTime - firstTime) / bucketSize), bucketCount - 1);
    buckets[bucketIndex]++;
  });
  
  return buckets;
};

const StatCard = memo(({ icon: Icon, label, value, color, subtext }) => (
  <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className={`text-xl md:text-2xl font-bold ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-2 md:p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color}`} />
      </div>
    </div>
  </div>
));

function Statistics({ apis }) {
  if (!apis || apis.length === 0) return null;

  const stats = useMemo(() => {
    const statsObj = {
      total: apis.length,
      successful: apis.filter(api => api.response?.status >= 200 && api.response?.status < 300).length,
      failed: apis.filter(api => api.response?.status >= 400).length,
      pending: apis.filter(api => !api.response).length,
      methods: {},
      avgResponseTime: 0,
      fastestApi: null,
      slowestApi: null
    };

    // Count methods and calculate response times
    const responseTimes = [];
    apis.forEach(api => {
      statsObj.methods[api.method] = (statsObj.methods[api.method] || 0) + 1;
    
    if (api.response?.responseTime) {
        responseTimes.push({
          time: api.response.responseTime,
          url: api.url
        });
      }
    });

    // Calculate average, fastest, and slowest
    if (responseTimes.length > 0) {
      const totalTime = responseTimes.reduce((sum, rt) => sum + rt.time, 0);
      statsObj.avgResponseTime = Math.round(totalTime / responseTimes.length);
      
      const sorted = [...responseTimes].sort((a, b) => a.time - b.time);
      statsObj.fastestApi = sorted[0];
      statsObj.slowestApi = sorted[sorted.length - 1];
    }

    // Calculate requests per minute
    let requestsPerMinute = 0;
    let timeSpanMinutes = 0;
    if (apis.length > 1) {
      const timestamps = apis.map(api => new Date(api.timestamp).getTime()).sort((a, b) => a - b);
      const firstRequest = timestamps[0];
      const lastRequest = timestamps[timestamps.length - 1];
      const timeSpanMs = lastRequest - firstRequest;
      timeSpanMinutes = timeSpanMs / 60000; // Convert to minutes
      
      if (timeSpanMinutes > 0) {
        requestsPerMinute = Math.round(apis.length / timeSpanMinutes);
      } else {
        // All requests in same minute
        requestsPerMinute = apis.length;
      }
    }
    statsObj.requestsPerMinute = requestsPerMinute;
    statsObj.timeSpanMinutes = Math.round(timeSpanMinutes * 10) / 10; // rounded to 1 decimal

    // Rate limit statistics
    const apisWithRateLimit = apis.filter(api => api.response?.rateLimit);
    const rateLimitWarnings = apisWithRateLimit.filter(api => api.response.rateLimit.isApproachingLimit);
    statsObj.rateLimitedApis = apisWithRateLimit.length;
    statsObj.rateLimitWarnings = rateLimitWarnings.length;
    
    // Find lowest remaining rate limit
    if (apisWithRateLimit.length > 0) {
      const lowestRateLimit = apisWithRateLimit.reduce((lowest, api) => {
        const current = api.response.rateLimit;
        if (!lowest || current.percentage < lowest.percentage) {
          return { ...current, url: api.url };
        }
        return lowest;
      }, null);
      statsObj.lowestRateLimit = lowestRateLimit;
    }

    return statsObj;
  }, [apis]);


  // Calculate sparkline data
  const requestFrequencySparkline = useMemo(() => calculateRequestFrequencySparkline(apis), [apis]);
  const responseTimeSparkline = useMemo(() => calculateResponseTimeSparkline(apis), [apis]);

  return (
    <div className="mb-4 md:mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        
        {/* Widget 1: Overview Stats */}
        <DashboardWidget
          title="API Overview"
          icon={TrendingUp}
          className="lg:col-span-2"
          sparklineData={requestFrequencySparkline}
          sparklineColor="blue"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total APIs"
              value={stats.total}
              color="text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Successful"
              value={stats.successful}
              color="text-green-600"
              subtext={`${Math.round((stats.successful / stats.total) * 100)}% success rate`}
            />
            <StatCard
              icon={XCircle}
              label="Failed"
              value={stats.failed}
              color="text-red-600"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={stats.pending}
              color="text-gray-600"
            />
          </div>
        </DashboardWidget>

        {/* Widget 2: Request Rate */}
        {stats.requestsPerMinute > 0 && (
          <DashboardWidget
            title="Request Rate"
            icon={Zap}
            sparklineData={requestFrequencySparkline}
            sparklineColor="purple"
          >
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.requestsPerMinute}
              </p>
              <p className="stat-label mt-2">Requests per Minute</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Over {stats.timeSpanMinutes} minute{stats.timeSpanMinutes !== 1 ? 's' : ''}
              </p>
            </div>
          </DashboardWidget>
        )}

        {/* Widget 3: Performance Metrics */}
        {stats.avgResponseTime > 0 && (
          <DashboardWidget
            title="Performance"
            icon={Zap}
            className="lg:col-span-3"
            sparklineData={responseTimeSparkline}
            sparklineColor="purple"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 md:p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs md:text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Avg Response Time</p>
                <p className="text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-200">{stats.avgResponseTime}ms</p>
              </div>
              {stats.fastestApi && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4 border border-green-200 dark:border-green-800">
                  <p className="text-xs md:text-sm text-green-700 dark:text-green-300 font-medium mb-1">Fastest API</p>
                  <p className="text-base md:text-lg font-bold text-green-900 dark:text-green-200">{stats.fastestApi.time}ms</p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate mt-1" title={stats.fastestApi.url}>
                    {stats.fastestApi.url.substring(0, 25)}...
                  </p>
                </div>
              )}
              {stats.slowestApi && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 md:p-4 border border-orange-200 dark:border-orange-800">
                  <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Slowest API</p>
                  <p className="text-base md:text-lg font-bold text-orange-900 dark:text-orange-200">{stats.slowestApi.time}ms</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 truncate mt-1" title={stats.slowestApi.url}>
                    {stats.slowestApi.url.substring(0, 25)}...
                  </p>
                </div>
              )}
            </div>
          </DashboardWidget>
        )}

        {/* Widget 4: Rate Limit Status */}
        {stats.rateLimitedApis > 0 && (
          <DashboardWidget
            title="Rate Limits"
            icon={Activity}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">APIs with Rate Limits</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-200">{stats.rateLimitedApis}</p>
              </div>
              {stats.rateLimitWarnings > 0 && (
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">⚠️ Warnings</p>
                  <p className="text-lg font-bold text-primary-900 dark:text-primary-200">{stats.rateLimitWarnings}</p>
                </div>
              )}
            </div>
            {stats.lowestRateLimit && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Lowest Rate Limit</p>
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                  {stats.lowestRateLimit.remaining}/{stats.lowestRateLimit.limit} ({Math.round(stats.lowestRateLimit.percentage)}%)
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 truncate mt-1" title={stats.lowestRateLimit.url}>
                  {stats.lowestRateLimit.url.substring(0, 50)}...
                </p>
              </div>
            )}
          </DashboardWidget>
        )}

        {/* Widget 5: Methods Distribution */}
        <DashboardWidget
          title="HTTP Methods"
          icon={Database}
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.methods).map(([method, count]) => (
              <div key={method} className="bg-white dark:bg-gray-700 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{method}</span>
                <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-medium">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </DashboardWidget>

      </div>
    </div>
  );
}

const areEqual = (prevProps, nextProps) => {
  return prevProps.apis === nextProps.apis;
};

export default memo(Statistics, areEqual);
