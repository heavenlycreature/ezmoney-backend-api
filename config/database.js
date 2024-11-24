const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();

const userCollection = db.collection('users');
const walletCollection = db.collection('wallets');


module.exports = {db, userCollection, walletCollection};