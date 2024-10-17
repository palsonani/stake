import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const updateUserMethod = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = req.body;

        // Log the update attempt
        await Logs.create({
            userId: userId,
            action: `User update attempt: userId=${userId}, data=${JSON.stringify(data)}`,
            logTime: new Date(),
        });

        // Update user data
        const [affectedRows] = await User.update(data, {
            where: { id: userId },
            returning: true 
        });

        if (affectedRows === 0) {
            await Logs.create({
                userId: userId,
                action: `User update failed: User not found, userId=${userId}`,
                logTime: new Date(),
            });
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch updated user details
        const updatedUser = await User.findOne({ where: { id: userId } });

        // Log successful update
        await Logs.create({
            userId: userId,
            action: `User updated successfully: userId=${userId}`,
            logTime: new Date(),
        });

        console.log("data updated");
        res.status(200).json({ message: "data updated", updatedUser });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: userId,
            action: `User update error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};
