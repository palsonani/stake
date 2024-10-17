import Medal from "../../models/Medals.js";
import Logs from '../../models/Logs.js'; 

export const createMedal = async (req, res) => {
    const { medalType, medalLevel, winAmount } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: req.user ? req.user.id : null, // Assuming user is attached to the request
            action: `Create medal request: medalType=${medalType}, medalLevel=${medalLevel}, winAmount=${winAmount}`,
            logTime: new Date(),
        });

        const mType = await Medal.findOne({
            where: { medalType }
        });

        const mLevel = await Medal.findOne({
            where: { medalLevel }
        });

        if (mType) {
            await Logs.create({
                userId: req.user ? req.user.id : null,
                action: `Create medal failed: medalType ${medalType} already exists`,
                logTime: new Date(),
            });
            return res.status(400).json({ message: 'Medal already exists' });
        }

        if (mLevel) {
            await Logs.create({
                userId: req.user ? req.user.id : null,
                action: `Create medal failed: medalLevel ${medalLevel} already exists`,
                logTime: new Date(),
            });
            return res.status(400).json({ message: 'Level already exists' });
        }

        const newMedal = await Medal.create({
            medalType,
            medalLevel,
            winAmount
        });

        // Log successful creation
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Medal created successfully: ${JSON.stringify(newMedal)}`,
            logTime: new Date(),
        });

        res.status(201).json({ message: 'Medal created successfully', newMedal });
    } catch (error) {
        // Log error
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Create medal error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};
