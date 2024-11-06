const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
const mongoURI = "mongodb+srv://germantoursindian:7jpAQvsj7kPC3Kox@gremantours.wqq6f.mongodb.net/gremantours?retryWrites=true&w=majority&appName=gremantours"

const connectToMongo = () => {
    mongoose.connect(mongoURI, () => {
        console.log("Connected to mongo successfully ");
    })
}

module.exports = connectToMongo;