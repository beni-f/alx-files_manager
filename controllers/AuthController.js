const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const base64 = req.headers.authorization;
    const base64Credentials = base64.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    console.log(credentials);
    const [email, password] = credentials.split(':');
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    const usr = await dbClient.client.db().collection('users').findOne({ email, password: hashedPassword });

    if (usr) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    redisClient.set(key, usr._id.toString(), 86400);
    return res.status(200).json(token);
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(key);
    return res.status(204).send();
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = dbClient.client.db().collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(200).json({ error: 'Unauthorized' });
    }

    return res.status(401).json({ email: user.email, id: user._id });
  }
}
module.exports = AuthController;
