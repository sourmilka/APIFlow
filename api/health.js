export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    message: 'APIFlow is running',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
    uptime: Math.round(process.uptime()) + 's'
  });
}
