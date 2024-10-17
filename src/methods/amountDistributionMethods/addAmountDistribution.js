import AmountDistribution from "../../models/AmountDistribution.js";
import Games from "../../models/Games.js";
import User from "../../models/user.js";

export const addAmountDistribution = async (req, res) => {
    const { userId, gameId, amount, status } = req.body;

    // Validate required fields
    if (!userId || !gameId || amount === undefined ) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the game exists
        const game = await Games.findByPk(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        // Check if the distribution already exists for this user and game
        const existingDistribution = await AmountDistribution.findOne({
            where: { userId, gameId }
        });

        if (existingDistribution) {
            return res.status(400).json({ message: 'Distribution already exists for this user and game.' });
        }

        // Create the new distribution
        const amountDistribution = await AmountDistribution.create({ userId, gameId, amount, status });
        res.status(201).json(amountDistribution);
    } catch (error) {
        console.error('Error adding AmountDistribution:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
