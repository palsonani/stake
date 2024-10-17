import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Logs from '../../models/Logs.js'; 
import Admin from '../../models/Admin.js';

export const loginAdminMethod = async (req, res) => {
    const { email, password } = req.body;
    
    console.log(req.body);

    if (!email) {
        await Logs.create({
            userId: email,  // Log the failed email as userId
            actionType: 'LOGIN_ATTEMPT',
            actionDescription: 'Login attempt failed: Email missing',
            logTime: new Date(),
            performOn: 'SELF',
            userName: email // Log the failed email in userName
        });
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!password) {
        await Logs.create({
            userId: email,  // Log the failed email as userId
            actionType: 'LOGIN_ATTEMPT',
            actionDescription: 'Login attempt failed: Password missing',
            logTime: new Date(),
            performOn: 'SELF',
            userName: email // Log the failed email in userName
        });
        return res.status(400).json({ error: 'Password is required' });
    }

    try {
        // Log the login attempt
        await Logs.create({
            userId: email,  // Log the failed email as userId for anonymous login attempt
            actionType: 'LOGIN_ATTEMPT',
            actionDescription: `Login attempt: email=${email}`,
            logTime: new Date(),
            performOn: 'SELF',
            userName: email // Log the failed email in userName
        });

        // Find user by email
        const user = await Admin.findOne({ where: { email } });
        if (!user) {
            await Logs.create({
                userId: email,  // Log the failed email as userId
                actionType: 'LOGIN_FAILED',
                actionDescription: `Login failed: Invalid Email ${email}`,
                logTime: new Date(),
                performOn: 'SELF',
                userName: email // Log the failed email in userName
            });
            return res.status(401).json({ error: 'Invalid Email' });
        }
       
        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await Logs.create({
                userId: user.id,  // Use the actual userId on invalid password
                actionType: 'LOGIN_FAILED',
                actionDescription: `Login failed: Invalid password. Email: ${email}`,
                logTime: new Date(),
                performOn: 'SELF',
                userName: user.username // Use the actual userName if found
            });
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Create a JWT token
        const token = jwt.sign({
                userId: user.userId,
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
            userId: user.id,  // Use actual userId
            actionType: 'LOGIN_SUCCESS',
            actionDescription: `User logged in successfully. Email=${email}`,
            logTime: new Date(),
            performOn: 'SELF',
            userName: user.username // Use the actual userName
        });

        // Send token and user info in response
        res.status(200).json({
            message: 'Admin logged in successfully',
            token
        });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: email,  // Log the failed email as userId in case of error
            actionType: 'LOGIN_ERROR',
            actionDescription: `Login error: ${error.message}`,
            logTime: new Date(),
            performOn: 'SELF',
            userName: email, // Log the failed email in userName in case of error
            details: error.stack,
        });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
