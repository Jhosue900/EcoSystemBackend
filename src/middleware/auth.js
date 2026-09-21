const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {

    const CLAVE_SECRETA = process.env.JWT_SECRET;

    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing authentication token' });
    }

    try {
        req.user = jwt.verify(token, CLAVE_SECRETA);
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { verifyToken };