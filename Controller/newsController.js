const news = require('./news')
const Article = require('../Model/Article');
const Redis = require('ioredis');

const redisClient = new Redis();

exports.getNews = async (req, res) => {
    let user = req.session.user;
    try {
        let category = req.params.category;
        if (!category) {
            category = '';
        };
        let allArticles = [];
        const cachedNews = await redisClient.get(`cachedNews:${category}`);
        if (cachedNews) {
            allArticles = JSON.parse(cachedNews)
            res.render('Home', { allArticles, user });
            return;
        }

        if (category === "preferred") {
            let preferences = user.preferences;
            const newsArticles = preferences.map(preference => news.newsFromDb(preference));
            if (!newsArticles) {
                newsArticles = preferences.map(preference => news.fetchNewsApi(preference));
            }
            allArticles = await Promise.all(newsArticles)
            allArticles = allArticles.flat();
            try {
                redisClient.set(`cachedNews:${category}`, JSON.stringify(allArticles), 'EX', 60).then(redRes => {
                    if (redRes !== 'OK') {
                        console.error('Does not get cached...')
                    }
                })
            } catch (error) {
                console.log('Error in Redis Set'.error);
            }
            res.render('Home', { allArticles, user });
            return;
        }

        allArticles = await news.newsFromDb(category);
        if (!allArticles) {
            allArticles = await news.fetchNewsApi(category);
            news.newsToDb(allArticles, category);    
        }
        try {
            redisClient.set(`cachedNews:${category}`, JSON.stringify(allArticles), 'EX', 60).then(redRes => {
                if (redRes !== 'OK') {
                    console.error('Does not get cached...')
                }
            })
        } catch (error) {
            console.log('Error in Redis Set'.error);
        }
        res.render('Home', { allArticles, user });
        return;
    } catch (error) {
        console.log(error)
        res.status(500).send('Server Error')
    }
}

