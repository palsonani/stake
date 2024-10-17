import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const loginUserMethod = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Log the login attempt with email
        await Logs.create({
            userId: email,  // Initially null since we haven't found the user yet
            actionType: 'LOGIN_ATTEMPT',
            actionDescription: `Login attempt: email=${email}`,
            logTime: new Date(),
            performOn: 'SELF',
            userName: email  // Log email in case userName is not found later
        });

        // Find user by email
        const user = await User.findOne({ where: { email } });

        // If user not found, log and return error
        if (!user) {
            await Logs.create({
                userId: email,
                actionType: 'LOGIN_FAILED',
                actionDescription: `Login failed: Invalid Email ${email}`,
                logTime: new Date(),
                performOn: 'SELF',
                userName: email // Log email as username when user is not found
            });
            return res.status(401).json({ error: 'Invalid Email' });
        }

        // If user account is disabled, log and return error
        if (!user.isActive) {
            await Logs.create({
                userId: user.id,
                actionType: 'LOGIN_FAILED',
                actionDescription: `Login failed: Account disabled. Email=${email}`,
                logTime: new Date(),
                performOn: 'SELF',
                userName: user.userName
            });
            return res.status(403).json({ error: 'Your account is disabled. Please contact support.' });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await Logs.create({
                userId: user.id,
                actionType: 'LOGIN_FAILED',
                actionDescription: `Login failed: Invalid password. Email=${email}`,
                logTime: new Date(),
                performOn: 'SELF',
                userName: user.userName
            });
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Create a JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                userName: user.userName,
                mobileNumber: user.mobileNumber,
                role: user.role
            },
            process.env.JWT_SECRET_KEY, 
            { expiresIn: '24h' }
        );
        res.cookie('token', token, { httpOnly: true });

        // Log successful login
        await Logs.create({
            userId: user.id,
            actionType: 'LOGIN_SUCCESS',
            actionDescription: `User logged in successfully. Email=${email}`,
            logTime: new Date(),
            performOn: 'SELF',
            userName: user.userName
        });

        // Send token and user info in response
        res.status(200).json({
            message: 'User logged in successfully',
            token
        });
    } catch (error) {
        console.error(error);
        // Log any errors encountered during the process
        await Logs.create({
            userId: null,
            actionType: 'LOGIN_ERROR',
            actionDescription: `Login error: ${error.message}`,
            logTime: new Date(),
            performOn: 'SELF',
            details: error.stack,
            userName: email // Log email when an error occurs
        });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
