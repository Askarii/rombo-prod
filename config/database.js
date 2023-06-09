const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

dotenv.config({path: '../.env'})

const connections = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URL)
        console.log(`Database connected ${connect.connection.host}`);
    } catch (error) {
        console.log(`Error while connecting database: ${error}`.bgRed.yellow);
    }
}

module.exports = connections;