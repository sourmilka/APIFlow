import { getCollection, COLLECTIONS } from '../config/mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const sessionsCollection = await getCollection(COLLECTIONS.SESSIONS);
    const session = await sessionsCollection.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update access tracking
    await sessionsCollection.updateOne(
      { sessionId },
      {
        $set: { lastAccessedAt: new Date() },
        $inc: { accessCount: 1 }
      }
    );

    const age = Math.round((Date.now() - session.createdAt.getTime()) / 60000);
    const timeUntilExpiration = Math.round((3600000 - (Date.now() - session.createdAt.getTime())) / 60000);

    res.json({
      ...session,
      metadata: {
        ageMinutes: age,
        timeUntilExpirationMinutes: Math.max(0, timeUntilExpiration),
        accessCount: (session.accessCount || 0) + 1
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error.message
    });
  }
}
