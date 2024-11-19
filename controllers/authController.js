const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let data = [];
const secretKey = 'your_secret_key';

const signup = async (req, res) => {
    try {     
        const { username, password } = req.body
        if(data.find((key) => key.username === username)){
            res.status(409).json({
                message: "Username already taken!"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        data.push({username, password: hashedPassword});
        res.status(201).send('User created!');
    } catch (err) {
        console.log(err);
        res.status(400).json({
            message: err.toString(),
        })
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = data.find((key) => key.username === username);
    
        if (!user) {
            return res.status(401).send('Invalid Credentials'); // Exit early if user not found
        }

        // Compare the provided password with the stored hashed password
        const pwd = await bcrypt.compare(password, user.password); // Use correct arguments

        if (!pwd) {
            return res.status(401).send('Invalid Credentials'); // Exit early if password is incorrect
        }
        const token = jwt.sign({userId: user.username}, secretKey, {expiresIn: '1h'});
        res.status(200).send({token});
} catch (err) {
    console.error(err);
    res.status(500).send('Internal Server error')
}
}


module.exports = {signup, login};