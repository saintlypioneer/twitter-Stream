require('dotenv').config();
const Twitter = require('twitter-lite');
const express = require('express');
const app = express();

const client = new Twitter({
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.API_KEY_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

app.get('/stream/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const user = await client.get('users/show', { screen_name: username });
    const userId = user.id_str;

    const stream = client.stream('statuses/filter', { follow: userId });

    stream.on('data', (tweet) => {
      if (tweet.user.id_str === userId) {
        res.write(JSON.stringify(tweet));
      }
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).send({ error: `Error streaming tweets: ${error.message}` });
    });

    res.setHeader('Content-Type', 'application/json');
    req.on('close', () => {
      stream.destroy();
    });

} catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ error: `Error fetching user: ${error.message || JSON.stringify(error)}` });
}

});

app.get('/recent-tweets/:username', async (req, res) => {
    const username = req.params.username;
  
    try {
      const userResponse = await client.get('users/by/username/:username', {
        username,
        expansions: 'pinned_tweet_id',
        'user.fields': 'id,created_at'
      });
      const userId = userResponse.data.id;
  
      const tweetsResponse = await client.get('tweets/search/recent', {
        query: `from:${userId}`,
        'tweet.fields': 'created_at'
      });
  
      res.status(200).send(tweetsResponse);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      res.status(500).send({ error: `Error fetching tweets: ${error.message || JSON.stringify(error)}` });
    }
  });
  

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
