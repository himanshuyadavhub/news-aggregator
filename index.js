const express = require('express');
const path = require('path');
const app = express();

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session)

require('dotenv').config();
const config = require('./config/config');
const constants = require('./config/constants');
const connectDB = require('./db/db');
connectDB();

const news = require('./Controller/news');


news.apiToDb(constants.categories);



const store = new MongoDBStore({
    uri: config.mongo_uri,
    collection: "mySessions",
  });

const newsController = require('./Controller/newsController');
const usersController = require('./Controller/usersController');
const { apiToDb } = require('./Controller/news');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
);


app.get('/signup', (req,res)=>{res.render('signup')});
app.post('/signup',usersController.postSignup);
app.get('/signin',(req,res)=>{res.render('login')});
app.post('/signin',usersController.postSignin);
app.post('/logout',usersController.logout);


app.get('/:category?',newsController.getNews);


app.listen(config.ePort,()=>{
    console.log(`Running on http://localhost:${config.ePort}/`)
});