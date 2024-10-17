import jwt from 'jsonwebtoken';

// Middleware to verify JWT token
export const authenticateJWT = (req, res, next) => { 
    let token = req.header('Authorization');

    if (!token) {
        token = req.cookies.token;  // Check in cookies if not provided in the header
        console.log("token", token);
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();  // Remove "Bearer " prefix if present
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);  // Verify the token
        req.user = decoded;  // Attach user information to the request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired.' });  // Handle token expiration
        }
        return res.status(400).json({ error: 'Invalid token.' });  // Handle other token errors
    }
};


// Middleware to check user roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}; 
