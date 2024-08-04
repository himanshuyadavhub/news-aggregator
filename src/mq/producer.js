const amqp = require('amqplib');
const news = require('../Controller/news')
const MQ = require('./setupMQ');



exports.newsToQueue = async (categories) => {
    const queueName = 'newsQueue';

    try {
        const { connection, channel } = await MQ.setupQueue(queueName);
        
        categories.forEach(async (category) => {
            try {
                
                let newsArticles = await news.fetchNewsApi(category);
                if (!newsArticles) {
                    throw new Error('No articles found for category', category);
                }
                console.log(`Fetched ${category} => ${newsArticles.length}`)

                newsArticles.map(ele => {
                    let msg = {
                        publishedAt: ele.publishedAt,
                        title: ele.title,
                        description: ele.description,
                        url: ele.url,
                        imgurl: ele.imgurl,
                        category: category
                    };

                    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));
                })
            } catch (error) {
                console.error(`Failed to fetch or send articles for category "${category}":`, error);
            };
        });

        setTimeout(async() => {
            await channel.close();
            await connection.close();
        }, 1000);

    } catch (error) {
        console.error('Error in newsToQueue:', error);
    };
};