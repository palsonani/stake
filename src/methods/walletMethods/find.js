import User from '../../models/user.js';
import Wallet from '../../models/Wallet.js';
import { addLog } from '../../utility/logs.js';

export const getWallet = async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }
    const user = await User.findByPk(userId);

    try {
        const wallet = await Wallet.findOne({ where: {userId} });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add log entry for wallet retrieval
        await addLog({
            userId: user.userId,
            userName: user.userName,
            actionType: 'get_WALLET',
            actionDescription: `Retrieved wallet for user ${userId}`,
            performOn: `wallet:${wallet.id}`
        });

        res.status(200).json(wallet);
    } catch (error) {
        console.error('Error retrieving wallet:', error.message);

        // Log the error
        await addLog({
            userId: userId || 'unknown',
            userName: user ? user.userName : 'unknown',
            actionType: 'ERROR',
            actionDescription: `Error retrieving wallet: ${error.message}`,
            performOn: 'wallet:get'
        });

        res.status(500).json({ message: 'Error retrieving wallet', error: error.message });
    }
};
