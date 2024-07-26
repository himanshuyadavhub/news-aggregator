const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    preferences:{
        type:[String],
        default:[]
    }
});

module.exports = mongoose.model('User',userSchema);