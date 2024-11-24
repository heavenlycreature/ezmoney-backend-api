const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
    const bearer = req.headers["authorization"];
    if (typeof bearer !== 'undefined') {     
        const token = bearer && bearer.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Token required" });
      
        jwt.verify(token, process?.env?.JWT_SECRET, (err, user) => {
          if (err) return res.status(403).json({ message: "Invalid token" });
          console.log(user);
          req.user = user;
          next();
        });
    } else{
        res.status(403).send('Forbidden');
    }
}
module.exports = validateToken;