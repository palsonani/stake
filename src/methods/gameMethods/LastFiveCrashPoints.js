import Bet from "../../models/Bet.js";
import Pull from "../../models/Pull.js";
import { addLog } from "../../utility/logs.js";

export const getLastFiveCrashPoints = async (req, res) => {
    try {
        await addLog(null, 'admin', 'INFO', 'Attempt to retrieve the last 5 crash points');

        const lastFiveCrashPoints = await Pull.findAll({
            attributes: ['crashPoint'],
            order: [['pullTime', 'DESC']],
            limit: 5
        });

        await addLog(null, 'admin', 'INFO', `Successfully retrieved last 5 crash points`);

        res.json({
            success: true,
            data: lastFiveCrashPoints
        });
    } catch (error) {
        console.error('Error fetching last 5 crash points:', error);
        await addLog(null, 'admin', 'ERROR', `Error fetching last 5 crash points: ${error.message}`, 'SELF');
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};



export const getLastFiveLimboPoints = async (req, res) => {
    const { gameId } = req.params; // Assuming gameId is passed as a route parameter

    try {
        await addLog(null, 'admin', 'INFO', `Attempt to retrieve the last 5 crash points for gameId: ${gameId}`);

        const lastFiveCrashPoints = await Bet.findAll({
            attributes: ['multiplier'],
            where: { gameId }, 
            order: [['betTime', 'DESC']],
            limit: 5
        });

        await addLog(null, 'admin', 'INFO', `Successfully retrieved last 5 crash points for gameId: ${gameId}`);

        res.json({
            success: true,
            data: lastFiveCrashPoints
        });
    } catch (error) {
        console.error(`Error fetching last 5 crash points for gameId ${gameId}:`, error);
        await addLog(null, 'admin', 'ERROR', `Error fetching last 5 crash points: ${error.message}`, 'SELF');

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


