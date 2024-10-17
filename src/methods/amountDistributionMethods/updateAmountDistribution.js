import AmountDistribution from "../../models/AmountDistribution.js";
import Games from "../../models/Games.js";
import User from "../../models/user.js";

export const updateAmountDistribution = async (req, res) => {
    const { id } = req.params;
    const { userId, gameId, amount, status } = req.body;

    // Validate required fields
    if (!userId || !gameId || amount === undefined ) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Find the existing distribution by ID
        const amountDistribution = await AmountDistribution.findByPk(id);
        if (!amountDistribution) {
            return res.status(404).json({ message: 'AmountDistribution not found.' });
        }

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

        // Update the distribution details
        await amountDistribution.update({ userId, gameId, amount, status });
        res.status(200).json(amountDistribution);
    } catch (error) {
        console.error('Error updating AmountDistribution:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
