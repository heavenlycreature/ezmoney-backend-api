const {Firestore} = require('@google-cloud/firestore');
require('dotenv').config();

const db = new Firestore({
    projectId: 'capstone-ezmoney-service-app',
    keyFilename: "./firestore-admin.json"
});

const userCollection = db.collection('users');


module.exports = {db, userCollection};