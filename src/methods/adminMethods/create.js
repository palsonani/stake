import { Op } from 'sequelize';
import Admin from '../../models/Admin.js';
import { addLog } from '../../utility/logs.js';

// Create an admin
export const createAdminMethod = async (req, res) => {
    try {
        const { userName, email, password, mobileNumber } = req.body;

        // Log the admin creation attempt
        await addLog(null, userName, 'ADMIN_CREATION_ATTEMPT', `Admin creation attempt: email=${email}, mobileNumber=${mobileNumber}`);

        if (!/^\d{10}$/.test(mobileNumber)) {
            await addLog(null, userName, 'ADMIN_CREATION_FAILED', `Invalid mobile number=${mobileNumber}`);
            return res.status(400).json({ error: 'Invalid mobile number' });
        }

        // Check if the email or username already exists
        const existingUser = await Admin.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { userName }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.userName === userName) {
                await addLog(null, userName, 'ADMIN_CREATION_FAILED', `Username ${userName} is not available.`);
                return res.status(400).json({ error: 'Username is not available' });
            }
            if (existingUser.email === email) {
                await addLog(null, userName, 'ADMIN_CREATION_FAILED', `Email ${email} already exists.`);
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        // Create a new admin
        const newAdmin = await Admin.create({
            userName,
            email,
            password,
            role: 'admin'
        }); 

        // Log successful admin creation
        await addLog(newAdmin.id, userName, 'ADMIN_CREATION_SUCCESS', `Admin created successfully: email=${email}, mobileNumber=${mobileNumber}`);

        res.status(200).json({ message: "User Created Successfully", newAdmin });
    } catch (error) {
        console.error(error);
        await addLog(null, null, 'ADMIN_CREATION_ERROR', `Admin creation error: ${error.message}`, 'SELF');
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
