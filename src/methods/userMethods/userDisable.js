import User from "../../models/user.js";
import Logs from '../../models/Logs.js'; 

export const userDisable = async (req, res) => {
    try {
        const { userId } = req.params;

        // Log the disable attempt
        await Logs.create({
            userId: userId,
            action: `User disable attempt: userId=${userId}`,
            logTime: new Date(),
        });

        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            await Logs.create({
                userId: userId,
                action: `User disable failed: User not found, userId=${userId}`,
                logTime: new Date(),
            });
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        // Log successful disable
        await Logs.create({
            userId: userId,
            action: `User disabled successfully: userId=${userId}`,
            logTime: new Date(),
        });

        res.json({ message: 'User disabled successfully' });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: userId,
            action: `User disable error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ message: 'Server error', error });
    }
};
