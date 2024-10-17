import Games from "../../models/Games.js";

export const updateGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { gameName, gameType, status, isActive } = req.body;

        const game = await Games.findOne({ where: { id: gameId } });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        // Update game properties
        game.gameName = gameName;
        game.gameType = gameType;
        game.status = status;
        game.isActive = isActive;

        await game.save();

        res.status(200).json({ message: 'Game updated successfully', game });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};
