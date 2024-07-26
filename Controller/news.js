const fetch = require('node-fetch');
const { LanguageServiceClient } = require('@google-cloud/language');
const config = require('../config/config');
const Article = require('../Model/Article');
require('dotenv').config();

const newsApiKey = config.newsApiKey;



exports.fetchNewsApi = async (category) => {
    let url = `https://newsapi.org/v2/top-headlines?country=in&apiKey=${newsApiKey}`;
    if (category) {
        url += `&category=${category}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    const newsArticles = data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        imgurl: article.urlToImage,
        publishedAt: article.publishedAt
    }))
    return newsArticles;
};

const categorizeNews = async (desc) => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
        process.exit(1);
    }
    const client = new LanguageServiceClient();

    const document = {
        content: desc,
        type: 'PLAIN_TEXT',
    };

    // Classify the text into categories
    try {
        let tags = [];
        const [classification] = await client.classifyText({ document });
        classification.categories.forEach(category => {
            tags = [...tags, ...category.name.toLowerCase().split(/[/& ]/)];
        });
        return [...new Set(tags)];
    } catch (error) {
        console.error('Error classifying text:', error.message);
    }
}

exports.newsToDb = async (newsArticles, category) => {
    let count = 0;
    await Promise.all(newsArticles.map(async (a) => {
        try {
            let publishedAt = a.publishedAt;
            let title = a.title;
            let description = a.description;

            let tags;
            if (description && description.split(" ").length >= 20) {
                tags = await categorizeNews(description);
            }

            if (!tags || tags.length === 0) {
                tags = [category];
            }

            let article = await Article.findOne({ publishedAt, title });
            if (!article) {
                article = new Article({
                    publishedAt: a.publishedAt,
                    title: a.title,
                    description: a.description,
                    url: a.url,
                    imgurl: a.imgurl,
                    tags: tags
                });
                await article.save();
                count++;
            } else if (article.description !== description) {
                article = new Article({
                    publishedAt: a.publishedAt,
                    title: a.title,
                    description: a.description,
                    url: a.url,
                    imgurl: a.imgurl,
                    tags: tags
                });
                await article.save();
                count++;
            }
        } catch (error) {
            console.error(`Failed to process article with title "${a.title}":`, error);
            throw new Error(`Error processing article with title "${a.title}"`);
        }
    }));
    return count;
}

exports.apiToDb = async (categories) => {
    categories.forEach(async(category) => {
        let allArticles = await this.fetchNewsApi(category);
        console.log(`Fetched ${category} => ${newsArticles.length}`)
        let count = await this.newsToDb(allArticles, category);
        console.log(`Latest ${category} news saved to DB are ${count}`,);
    })
}

exports.newsFromDb = async (category) => {
    const newsArticles = await Article.find({ tags: category });
    if (newsArticles.length !== 0) {
        return newsArticles;
    } else {
        return null;
    }
}

