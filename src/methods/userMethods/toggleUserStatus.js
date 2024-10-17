import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body; 

        // Log the attempt
        const action = isActive ? '1' : '0';
        await Logs.create({
            userId: userId,
            action: `User ${action} attempt: userId=${userId}`,
            logTime: new Date(),
        });

        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            await Logs.create({
                userId: userId,
                action: `User ${action} failed: User not found, userId=${userId}`,
                logTime: new Date(),
            });
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = isActive;
        await user.save();

        // Log successful action
        await Logs.create({
            userId: userId,
            action: `User ${action}d successfully: userId=${userId}`,
            logTime: new Date(),
        });

        const message = `User ${isActive ? 'enabled' : 'disabled'} successfully`;
        res.json({ message });
    } catch (error) {
        console.error(error);
        await Logs.create({
            action: `User ${action} error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ message: 'Server error', error });
    }
};
