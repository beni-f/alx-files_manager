const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { ObjectId } = require('mongodb');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const redisKey = `auth_${token}`;
    const userId = await redisClient.get(redisKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, isPublic = false, parentId = 0, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(parentId) });
      console.log(parentFile)

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };

    if (type === 'folder') {
      await dbClient.client.db().collection('files').insertOne(fileDocument);
      return res.status(201).json(fileDocument);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const localPath = path.join(folderPath, uuidv4());
    const fileData = Buffer.from(data, 'base64');

    fs.writeFileSync(localPath, fileData);

    fileDocument.localPath = localPath;
    const file = await dbClient.client.db().collection('files').insertOne(fileDocument);

    return res.status(201).json( {
        id: file.insertedId,
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { parentId = 0, page = 0 } = req.query;

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    const files = await dbClient.client.db().collection('files').find(query).skip(parseInt(page, 10) * 20).limit(20).toArray();

    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token']
    const id = req.params.id
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    const userId = await redisClient.get(`auth_${token}`)

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) {
        return res.status(404).json({ error: 'Not found' })
    }
    file.isPublic = true;
    return res.status(200).json(file)
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token']
    const id = req.params.id
    if (!token) 
        return res.status(401).json({ error: 'Unauthorized' })
    const userId = await redisClient.get(`auth_${token}`)
    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) })
    if (!file) 
        return res.status(404).json({ error: 'Not found' })
    file.isPublic = false;
    return res.status(200).json(file)
  }
}

module.exports = FilesController;
