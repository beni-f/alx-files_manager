const crypto = require('crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { ObjectId } = require('mongodb'); // Import ObjectId
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

        const { name, type, isPublic = false, parentId = 0, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Check if parentId is valid
        if (parentId !== 0) {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });

            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }

            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const fileDocument = {
            userId: ObjectId(userId),
            name,
            type,
            parentId: parentId !== 0 ? ObjectId(parentId) : 0,
            isPublic,
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
        await dbClient.db.collection('files').insertOne(fileDocument);

        return res.status(201).json(fileDocument);
    }
}

module.exports = FilesController;
