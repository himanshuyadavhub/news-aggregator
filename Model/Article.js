const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    publishedAt:{
        type:Date
    },
    tags:{
        type:[String],
        validate:{
            validator:function(array){
                return array.length === new Set(array).size;
            },
            message:'Categories must be unique...'
        }
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    url:{
        type:String,
        required:true
    },
    imgurl:{
        type:String
    }
});

module.exports = mongoose.model('Articles',articleSchema);