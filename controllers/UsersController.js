const crypto = require('crypto');
const dbClient = require('../utils/db');

async function postNew(req, res) {
  console.log(req.body);
  const { email, password } = req.body;

  console.log(email, password);

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  const userExists = await dbClient.db.collection('users').findOne({ email });

  if (userExists) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  const newUser = {
    email,
    password: hashedPassword,
  };

  const result = await dbClient.db.collection('users').insertOne(newUser);

  return res.status(201).json({
    id: result.insertedId,
    email,
  });
}

module.exports = { postNew };
