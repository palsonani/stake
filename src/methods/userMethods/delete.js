import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const deleteUserMethod = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Log the deletion attempt
        await Logs.create({
            userId: userId,
            action: `User deletion attempt: userId=${userId}`,
            logTime: new Date(),
        });

        // Delete user record
        const result = await User.destroy({
            where: { id: userId }
        });

        if (result === 0) {
            await Logs.create({
                userId: userId,
                action: `User deletion failed: User not found, userId=${userId}`,
                logTime: new Date(),
            });
            return res.status(404).json({ error: 'User not found' });
        }

        // Log successful user deletion
        await Logs.create({
            userId: userId,
            action: `User deleted successfully: userId=${userId}`,
            logTime: new Date(),
        });

        console.log("User deleted");
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: null,
            action: `User deletion error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};
