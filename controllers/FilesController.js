class FilesController {
    static postUpload (req, res) {
        const token = req.headers['x-token']
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' })

        const fileInfo = req.body
        const name = fileInfo['name']
        const type = fileInfo['type']
        const data = fileInfo['data']
        const valid_types = ['folder', 'file', 'image']
        const isPublic = fileInfo['isPublic'] || false
        const parentId = fileInfo['parentId'] || 0

        if (!name) 
            return res.status(400).json({ error: 'Missing name' })
        if (!type || !type === 'folder' || !type === 'file' || !type === 'image')
            return res.status(400).json({ error: 'Missing type' })
        if (!data && type != 'folder') 
            return res.status(400).json({ error: 'Missing data' })
        if (parentId) {
            
        }
    }
}

module.exports = FilesController