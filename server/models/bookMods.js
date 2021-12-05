const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title : String,
    stock : Number,
    author : String,
    category : String,
    comments : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment",
    }],
});

module.exports =  mongoose.model("Book", bookSchema);