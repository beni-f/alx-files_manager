const db = require('../utils/db');
const redis = require('../utils/redis');

const getStatus = (req, res) => {
  if (db.isAlive && redis.isAlive) {
    const message = { redis: true, db: true };
    res.status(200);
    res.json(message);
  }
};

async function getStats(req, res) {
  try {
    const usersStat = await db.nbUsers();
    const filesStat = await db.nbFiles();

    const resp = { users: usersStat, files: filesStat };
    res.status(200);
    res.json(resp);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Unable to fetch stats' });
  }
}

module.exports = { getStats, getStatus };
