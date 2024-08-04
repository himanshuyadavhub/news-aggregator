const amqp = require('amqplib');
const MQ = require('./setupMQ');
const Article = require('../../Model/Article');
const news = require('../Controller/news')



exports.newsFromQueue = async () => {
    const queueName = 'newsQueue';

    try {
        const { connection, channel } = await MQ.setupQueue(queueName);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    let article = JSON.parse(msg.content.toString());
                    let { title, description, publishedAt, category, url, imgurl } = article;

                    let tags;
                    if (description && description.split(" ").length >= 20) {
                        tags = await news.categorizeNews(description);
                    }

                    if (!tags || tags.length === 0) {
                        tags = [category];
                    }

                    let newArticle = await Article.findOne({ publishedAt, title });
                    if (!newArticle) {
                        newArticle = new Article({
                            publishedAt,
                            title,
                            description,
                            url,
                            imgurl,
                            tags
                        });
                        await newArticle.save();
                    } else if (newArticle.description !== description) {
                        newArticle.description = description;
                        newArticle.url = url;
                        newArticle.imgurl = imgurl;
                        newArticle.tags = tags;
                        await newArticle.save();
                    }

                    // Acknowledge the message
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    
                }
            }
        }, { noAck: false });

    } catch (error) {
        console.error('Failed to connect to RabbitMQ or create a channel:', error);
    };
};

this.newsFromQueue();

