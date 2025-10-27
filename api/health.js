export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    status: 'ok',
    message: 'APIFlow serverless functions are running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
}
