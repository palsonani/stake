import { Op } from 'sequelize';
import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const createUserMethod = async (req, res) => {
    try {
        const {
            firstName, lastName, userName, email, countryCode, mobileNumber,
            password, DOB, country, address, city, postalcode, occupation, referFrom
        } = req.body;

        // Log the user creation attempt
        await Logs.create({
            userId: null, 
            action: `User creation attempt: email=${email}, mobileNumber=${mobileNumber}`,
            logTime: new Date(),
        });

        if (!/^\d{10}$/.test(mobileNumber)) {
            return res.status(400).json({ error: 'Invalid mobile number' });
        }

        // Check if the mobile number and email already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { mobileNumber },
                    { email },
                    { userName }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.userName === userName) {
                await Logs.create({
                    userId: null,
                    action: `User creation failed: UserName ${userName} is not available.`,
                    logTime: new Date(),
                });
                return res.status(400).json({ error: 'UserName is not available' });
            }
            if (existingUser.mobileNumber === mobileNumber) {
                await Logs.create({
                    userId: null,
                    action: `User creation failed: Mobile number ${mobileNumber} already exists.`,
                    logTime: new Date(),
                });
                return res.status(400).json({ error: 'Mobile number already exists' });
            }
            if (existingUser.email === email) {
                await Logs.create({
                    userId: null,
                    action: `User creation failed: Email ${email} already exists.`,
                    logTime: new Date(),
                });
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        // Create a new user
        const newUser = await User.create({
            firstName,
            lastName,
            userName,
            email,
            countryCode,
            mobileNumber,
            password,
            DOB,
            country,
            address,
            city,
            postalcode,
            occupation,
            referFrom
        });

        // Log successful user creation
        await Logs.create({
            userId: newUser.id,
            action: `User created successfully: email=${email}, mobileNumber=${mobileNumber}`,
            logTime: new Date(),
        });

        res.status(200).json({ message: "User Created Successfully", newUser });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: null,
            action: `User creation error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
