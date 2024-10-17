import Games from "../../models/Games.js";
import { addLog } from "../../utility/logs.js";

export const toggleGameStatus = async (req, res) => {
    const { gameId } = req.params;
    const { isActive } = req.body;

    try {
        const game = await Games.findOne({ where: { id: gameId } });

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        game.isActive = isActive;
        await game.save();

        const message = isActive ? 'Game enabled successfully' : 'Game disabled successfully';
        
        // Log the action
        await addLog(
            req.user ? req.user.id : null, 
            'admin', 
            'UPDATE', 
            `Game ${isActive ? 'enabled' : 'disabled'}`,
            game.gameName 
        );

        res.json({ message, game });
    } catch (error) {
        console.error('Error updating game status:', error);

        // Log the error
        await addLog(
            req.user ? req.user.id : null,
            req.user ? req.user.userName : 'admin',
            'ERROR',
            'Error updating game status',
            // game ? game.gameName : 'Unknown Game',
            error.message
        );

        res.status(500).json({ message: 'Server error', error });
    }
};
