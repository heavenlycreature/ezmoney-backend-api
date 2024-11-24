const {walletCollection} = require('../config/database');

const saveUserWallet = async (req, res) => {
    const {userId} = req.user;
    const {date, mode, description, ...saving} = req.body;
    return res.status(201).json({
        date, mode, description, ...saving
    });
}

module.exports = saveUserWallet;