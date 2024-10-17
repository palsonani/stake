import Logs from '../../models/Logs.js';
import User from "../../models/user.js";

export const findUserMethod = async (req, res) => {
    try {
        // Log the find all users attempt
        await Logs.create({
            userId: null,
            action: 'Find all users attempt',
            logTime: new Date(),
        });

        // Get pagination data from the request query
        const { page = 1, limit = 10 } = req.query; 
        const offset = (page - 1) * limit; 

        // Fetch users with pagination
        const { rows: users, count: totalUsers } = await User.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        if (!users.length) {
            await Logs.create({
                userId: null,
                action: 'No users found',
                logTime: new Date(),
            });
            return res.status(200).json({ message: "Data not found", response: [] });
        }

        // Log successful user retrieval
        await Logs.create({
            userId: null,
            action: `Users retrieved successfully: ${users.length} users found`,
            logTime: new Date(),
        });

        // Return paginated response
        res.status(200).json({
            message: "Data found",
            UserList: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                usersPerPage: parseInt(limit),
            }
        });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: null,
            action: `Error retrieving users: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const findByUserIdUserMethod = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Log the find by userId attempt
        await Logs.create({
            userId: userId,
            action: `Find user by userId attempt: userId=${userId}`,
            logTime: new Date(),
        });

        const response = await User.findOne({ where: { id: userId } });

        if (!response) {
            await Logs.create({
                userId: userId,
                action: `Find user by userId failed: User not found, userId=${userId}`,
                logTime: new Date(),
            });
            return res.status(200).json({ message: "Data not found", response: [] });
        }

        // Log successful user retrieval
        await Logs.create({
            userId: userId,
            action: `User retrieved successfully: userId=${userId}`,
            logTime: new Date(),
        });

        res.status(200).json({ message: "Data found", response });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: userId,
            action: `Error finding user by userId: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};