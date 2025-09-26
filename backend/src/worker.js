const express = require('express');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('CyberSecScan Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

