const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {config} = require('dotenv');
const {db, userCollection} = require('../config/database')
config();

const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email, 
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
  };

const signup = async (req, res) => {
    const { username, email, password } = req.body;

    
    if (!username || !email || !password) {
        return res
        .status(400)
        .json({ error: "Please provide name, email, and password" });
    }

    const emailQuery = await userCollection.where('email', '==', email).get();
    const usernameQuery = await userCollection.where('username', '==', username).get();

      if (!emailQuery.empty || !usernameQuery.empty) {
        return res.status(409).json({
          message: "Email/Username already taken!"
        });
      }
    try {     
        const hashedPassword = await bcrypt.hash(password, 8);
        const data = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toJSON().slice(0, 10),
            updatedAt: new Date().toJSON().slice(0, 10)
        };
        const userRef = await userCollection.add(data);
        const token = generateToken({name: username, email, id: userRef.id});
        return res.status(201).json({
            message: 'User created successfully!',
            token,
            userId: userRef.id
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            message: err.toString(),
        })
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;
   
    const userQuery = await userCollection.where('email', '==', email).get(); 
    if (userQuery.empty) {
      return res.status(401).json({ message: 'Data tidak cocok!, coba login ulang!' });
    }
    
    try {
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const isPasswordValid = await bcrypt.compare(password, userData.password);
       
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Data tidak cocok!, coba login ulang!' });
          }

          const token = generateToken({ 
            name: userData.username, 
            email: userData.email,
            id: userDoc.id,
          });
      
          return res.status(200).json({ 
            message: 'Login successful',
            token,
            userId: userDoc.id
          });
} catch (err) {
    console.error(err);
    res.status(500).send('Internal Server error')
}
}

const logout =  (req, res) => {
  return res.status(200).json({ message: "User logged out successfully" });
}


module.exports = {signup, login, logout};