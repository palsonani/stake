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
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Add log entry for wallet retrieval
        await addLog(
            String(user.id),         
            user.userName,           
            'get_WALLET',            
            `Retrieved wallet for user ${user.id}`,  
            `wallet:${wallet.id}`    
        );

        res.status(200).json(wallet);
    } catch (error) {
        console.error('Error retrieving wallet:', error);

        // Log the error
        await addLog({
            userId: user ? String(user.id) : 'unknown',  // Ensure userId is a string
            userName: user ? user.userName : 'unknown',
            actionType: 'ERROR',
            actionDescription: `Error retrieving wallet: ${error.message}`,
            performOn: 'wallet:get'
        });

        res.status(500).json({ message: 'Error retrieving wallet', error: error.message });
    }
};
