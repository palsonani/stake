import Logs from '../../models/Logs.js'; 
import jwt from 'jsonwebtoken';

export const signoutUserMethod = async (req, res) => {
    try {
        // Get the token from cookies
        const token = req.cookies.token;
        
        // If no token is found, return a 400 response
        if (!token) {
            return res.status(400).json({ message: 'No user is logged in' });
        }

        // Decode the JWT token to get user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Log the signout action
        await Logs.create({
            userId: decoded.userId,
            action: `User logged out successfully. Email=${decoded.email}`,
            logTime: new Date(),
        });

        // Clear the token cookie
        res.clearCookie('token', { httpOnly: true });

        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
    } catch (error) {
        console.error('Error signing out user:', error);
        await Logs.create({
            userId: null,
            action: `Signout error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};
