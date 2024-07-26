require('dotenv').config();

module.exports = {
    ePort : process.env.E_PORT,
    mongo_uri : process.env.MONGO_URI,
    newsApiKey:process.env.NEWS_API_KEY,
}