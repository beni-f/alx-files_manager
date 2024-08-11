const Queue = require('bull');
const dbClient = require('./utils/db');
const { ObjectId } = require('mongodb');
const fileQueue = Queue('fileQueue')
const imageThumbnail = require('image-thumbnail');
const fs = require('fs')

fileQueue.process(async (job) => {
    const { fileId, userId } = job.data;

    if (!fileId) throw new Error('Missing fileId');

    if (!userId) throw new Error('Missing userId')

    const file = await dbClient.client.db().collection('files').findOne({
        _id: ObjectId(userId),
        userId: ObjectId(userId),
    })

    if (!file) throw new Error('File not found')

    const sizes = [500, 250, 100]
    for (const size of sizes) {
        const thumbnail = await imageThumbnail(file.localPath, { width: size })
        const thumbnailPath = `${file.localPath}_${size}`
        fs.writeFileSync(thumbnailPath, thumbnail)
    }
    
})