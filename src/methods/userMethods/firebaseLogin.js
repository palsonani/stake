import jwt from 'jsonwebtoken';  
import { auth } from '../../utility/firebase.js';
import firebaseUser from '../../models/firebaseUser.js';  
import User from '../../models/user.js';
import Logs from '../../models/Logs.js'; 

export const firebaseLoginUserMethod = async (req, res) => {
    const { uid } = req.body;

    try {
        // Log the login attempt
        await Logs.create({
            userId: null, 
            action: `Firebase login attempt: uid=${uid}`,
            logTime: new Date(),
        });

        // Get user details from Firebase using UID
        const firebaseUserDetail = await auth.getUser(uid);

        // Extract user details from Firebase
        const { email, displayName, photoURL } = firebaseUserDetail;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            await Logs.create({
                userId: null,
                action: `Firebase login failed: Email ${email} already registered with normal signup.`,
                logTime: new Date(),
            });
            return res.status(401).json({ error: 'This email is already registered with normal signup. Please log in using your email and password.' });
        }

        // Check if user already exists in the database
        let user = await firebaseUser.findOne({ where: { uid } });

        if (!user) {
            // Create a new user in the database if not exists
            user = await firebaseUser.create({
                uid,
                email,
                displayName,
                photoURL
            });
        }

        // Create a JWT token
        const token = jwt.sign(
            {
                uid: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            },
            process.env.JWT_SECRET_KEY, 
            { expiresIn: '1h' } 
        );
        res.cookie('token', token, { httpOnly: true });

        // Log successful login
        await Logs.create({
            userId: user.id,
            action: `User logged in successfully via Firebase. UID=${uid}`,
            logTime: new Date(),
        });

        // Send success response with user details
        res.status(200).json({ message: 'User logged in successfully', token });
    } catch (error) {
        console.error('Error during Firebase login:', error);
        await Logs.create({
            userId: null,
            action: `Firebase login error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(401).json({ message: 'Authentication failed', error });
    }
};
