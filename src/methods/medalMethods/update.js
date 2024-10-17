import Medal from "../../models/Medals.js";
import Logs from '../../models/Logs.js'; // Import the Logs model

export const updateMedal = async (req, res) => {
    const { medalId } = req.params;
    const { medalType, medalLevel, winAmount } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: req.user ? req.user.id : null, // Assuming user is attached to the request
            action: `Update medal request: medalId=${medalId}, medalType=${medalType}, medalLevel=${medalLevel}, winAmount=${winAmount}`,
            logTime: new Date(),
        });

        const medal = await Medal.findOne({ where: { id: medalId } });
        if (!medal) {
            await Logs.create({
                userId: req.user ? req.user.id : null,
                action: `Update medal failed: Medal with ID ${medalId} not found`,
                logTime: new Date(),
            });
            return res.status(404).json({ message: 'Medal not found' });
        }

        // Update medal properties
        medal.medalType = medalType;
        medal.medalLevel = medalLevel;
        medal.winAmount = winAmount;

        await medal.save();

        // Log successful update
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Medal updated successfully: ${JSON.stringify(medal)}`,
            logTime: new Date(),
        });

        res.status(200).json({ message: 'Medal updated successfully', medal });
    } catch (error) {
        // Log error
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Update medal error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};
