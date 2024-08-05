const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto')
const dbClient = require('../utils/db')
const redisClient = require('../utils/redis')

class AuthController {
    static async getConnect (req, res) {
        const base64Credentials = req.headers.authorization
        console.log(base64Credentials.split(' ')[1])
        const credentials = Buffer.from(token, 'base64').toString('utf-8')
        const [email, password] = credentials.split(':')
        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex')
    
        const usr = await dbClient.client.db().collection('users').findOne({ email, password: hashedPassword })
    
        if (usr) {
            return res.status(401).json({ error: 'Unauthorized' })
        } else {
            const token = uuidv4();
            const key = `auth_${token}`;
            redisClient.set(key, usr._id.toString(), 86400)
            return res.status(200).json(token)
        }
    }
    
    static async getDisconnect (req, res) {
        const token = req.headers['x-token']
        if (!token) 
            return res.status(401).json({ error: 'Unauthorized'})
        const key = `auth_${token}`
        const userId = await redisClient.get(key)
    
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' })
    
        redisClient.del(key);
    }
    
    static async getMe(req, res) {
        const token = req.headers['x-token']
        if (!token) 
            return res.status(401).json({ error: 'Unauthorized' })
    
        const key = `auth_${token}`
        const userId = await redisClient.get(key)
    
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' })
    
        const user = dbClient.client.db().collection('users').findOne({ _id: userId })
    
        if (!user) {
            return res.status(200).json({ error: 'Unauthorized' })
        }
    
        return res.status(401).json({ email: user.email, id: user._id })
    }
    
}
module.exports = AuthController;
