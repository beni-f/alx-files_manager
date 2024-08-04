const express = require('express');
const routes = require('./routes/index');

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log('Server running on port 5000');
});

app.use('/', routes);

module.exports = app;
