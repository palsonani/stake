import User from '../../models/user.js';
import Wallet from '../../models/Wallet.js';
import { addLog } from '../../utility/logs.js';

export const createWallet = async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required!' });
    }
    const user = await User.findByPk(userId);
    const wallet = await Wallet.findByPk(userId);

    if (wallet) {
        return res.status(400).json({ message: 'wallet alrady exist!' });
    }

    try {
        const newWallet = await Wallet.create({
            userId,
            currencyType: 'INR',
            totalAmount: 0.00,
            currentAmount: 0.00
        });

        // Add log entry for wallet creation
        await addLog({
            userId,
            userName: user.userName,
            actionType: 'CREATE_WALLET',
            actionDescription: `Wallet created for user ${userId}`,
            performOn: `wallet:${newWallet.id}`
        });

        res.status(201).json(newWallet);
    } catch (error) {
        // Log the error in case of failure
        await addLog({
            userId: userId,
            userName: user.userName,
            actionType: 'ERROR',
            actionDescription: `Error creating wallet`,
            performOn: 'wallet:create'
        });

        res.status(500).json({ message: 'Error creating wallet', error: error.message });
    }
};
