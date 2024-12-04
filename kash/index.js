const express = require('express');
const { createClient } = require('redis');

const app = express();
const redisClient = createClient();

(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
})();

const fakeDatabase = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`
}));

app.use((req, res, next) => {
  console.time(`Request time for ${req.url}`);
  next();
  console.timeEnd(`Request time for ${req.url}`);
});

app.get('/data-nocache', (req, res) => {
  res.json(fakeDatabase);
});

app.get('/data-cache', async (req, res) => {
  try {
    const cachedData = await redisClient.get('data');
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    } else {
      await redisClient.setEx('data', 600, JSON.stringify(fakeDatabase));
      return res.json(fakeDatabase);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
