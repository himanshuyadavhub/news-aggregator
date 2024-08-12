const fetch = require('node-fetch');
const amqp = require('amqplib');
const { LanguageServiceClient } = require('@google-cloud/language');
const config = require('../../config/config');
const Article = require('../../Model/Article');
require('dotenv').config();





exports.fetchNewsApi = async (category) => {
    const newsApiKey = config.newsApiKey;
    if (!newsApiKey) {
        throw new Error('API key was not found....');
    }

    let url = `https://newsapi.org/v2/top-headlines?country=in&apiKey=${newsApiKey}`;
    if (category) {
        url += `&category=${category}`;
    };

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch news Articles', response.statusText);
        };

        const data = await response.json();

        const newsArticles = data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            imgurl: article.urlToImage,
            publishedAt: article.publishedAt
        }))
        return newsArticles;
    } catch (error) {
        console.error('Error fetching news articles:', error);
        throw error;
    }

};


exports.categorizeNews = async (desc) => {
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


exports.newsFromDb = async (category,date) => {
    const formattedDate = formatDate(date);
    let startDate = formattedDate[0];
    let endDate = formattedDate[1];
    try {
        let newsArticles;
        if(!category){
            newsArticles = await Article.find({
                publishedAt: { $gte: startDate, $lte: endDate }
            });
        }else{
            newsArticles = await Article.find({ 
                tags:category,
                publishedAt: { $gte: startDate, $lte: endDate } 
            });
        }
        
        if (newsArticles.length !== 0) {
            return newsArticles;
        } else {
            console.log(`Zero news fetched under category ${category} between date ${startDate} and ${endDate}`);
            return null;
        }
    } catch (error) {
        console.log('Error in fetching news from DB',error.message);
    }

}


const formatDate = (date) => {
    let startDate =  new Date(`${date}T00:00:00.000+00:00`).toISOString().replace('Z', '+00:00');
    let endDate = new Date(`${date}T23:59:59.999Z`).toISOString().replace('Z','+00:00');
    return ([startDate,endDate]);
}
