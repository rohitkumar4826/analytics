const express = require('express');
const app = express();
const axios = require('axios');
const _ = require('lodash');
const port = process.env.PORT || 5500;
const path = require('path');
const bp = require('body-parser');
const memoize = require('lodash/memoize');

// Middleware to parse JSON requests
app.use(bp.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Data storage for caching
var cachedData = null;

const fetchAndAnalyzeBlogData = memoize(async () => {
  try {
    // Make the CURL request to fetch blog data
    const curlOptions = {
      method: 'GET',
      url: 'https://intent-kit-16.hasura.app/api/rest/blogs',
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    };
    const response = await axios(curlOptions);
    const blogData = response.data.blogs;
    console.log('blogdata', blogData);
    // Calculate analytics
    const totalBlogs = blogData.length;
    const longestTitle = _.maxBy(blogData, (blog) => blog.title.length);
    const blogsWithPrivacy = blogData.filter((blog) => blog.title.toLowerCase().includes('privacy'));
    const uniqueTitles = _.uniqBy(blogData, 'title');

    // Store analytics in the cache
    cachedData = {
      totalBlogs,
      longestTitle: longestTitle.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueTitles: uniqueTitles.map((blog) => ({ title: blog.title, image_url: blog.image_url })),
    };
    return cachedData;
  } catch (error) {
    console.error('Error fetching and analyzing blog data:', error);
    throw new Error('An error occurred while processing the request.');
  }

}
);

// Middleware to fetch and analyze blog data
app.get('/api/blog-stats', async (req, res) => {
  try {
    // Used the memoized function to fetch and analyze blog data
    const cachedData = await fetchAndAnalyzeBlogData();

    // Respond with analytics
    res.json(cachedData);
  } catch (error) {
    console.error('Error fetching and analyzing blog data:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Middleware for blog search
app.post('/api/blog-search', (req, res) => {
  console.log('inside blog-search');
  try {
    const query = req.body.query;
    console.log(query);

    // Check if data is cached
    console.log('cachedata', cachedData);
    if (!cachedData) {
      res.status(400).json({ error: 'No cached data available for searching.' });
      return;
    }

    // Searching for blogs containing the query string
    const searchResults = cachedData.uniqueTitles.filter((blog) =>
      blog.title.toLowerCase().includes(query)
    );

    // Respond with search results
    res.json({ 'searchResults': searchResults });
  } catch (error) {
    console.error('Error searching for blogs:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
