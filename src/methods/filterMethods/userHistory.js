import Bet from "../../models/Bet.js";
import User from "../../models/user.js";
import Wallet from "../../models/Wallet.js";
import { addLog } from "../../utility/logs.js";

export const getUserHistoryById = async (req, res) => {
    const { userId } = req.params; // Get userId from request parameters
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters from query string

    try {
        // Fetch the user with associated bets and wallet info by userId
        const user = await User.findOne({
            where: { id: userId }, // Filter by userId
            include: [
                {
                    model: Bet,
                    as: 'bets',
                    attributes: ['id', 'betAmount', 'winAmount', 'cashOutAt', 'betTime'],
                    limit: parseInt(limit, 10),
                    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10) // Calculate offset for pagination
                },
                {
                    model: Wallet,
                    as: 'wallet',
                    attributes: ['currentAmount', 'totalAmount']
                }
            ]
        });
        const totalBetsCount = await Bet.count({
            where: { userId }
        });
        if (!user) {
            await addLog(
                req.user ? req.user.id : null,
                'admin',
                'INFO',
                `User with ID ${userId} not found`,
                'SELF'
            );
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Calculate total bet, total win, total loss for the user, plus win/loss count and total spent
        let totalBets = 0;
        let totalWinsAmount = 0;
        let totalLossesAmount = 0;
        let totalAmountSpent = 0;
        let numberOfWins = 0;
        let numberOfLosses = 0;

        // Process the user's bets
        user.bets.forEach(bet => {
            totalBets += 1;
            totalAmountSpent += parseFloat(bet.betAmount) || 0;
            if (bet.winAmount && bet.winAmount > 0) {
                numberOfWins += 1;
                totalWinsAmount += parseFloat(bet.winAmount);
            } else {
                numberOfLosses += 1;
                totalLossesAmount += parseFloat(bet.betAmount) || 0;
            }
        });

        // Calculate overall profit (totalWinsAmount - totalAmountSpent)
        const overallProfit = totalWinsAmount - totalAmountSpent;

        const userWithHistory = {
            ...user.toJSON(),
            totalBets:totalBetsCount,
            numberOfWins,
            numberOfLosses,
            totalWinsAmount: totalWinsAmount.toFixed(2),
            totalLossesAmount: totalLossesAmount.toFixed(2),
            totalAmountSpent: totalAmountSpent.toFixed(2),
            overallProfit: overallProfit.toFixed(2),
            currentWalletBalance: user.wallet?.currentAmount || 0,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalBets: totalBetsCount 
            }
        };

        // Log the action
        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'INFO',
            `Retrieved history for user with ID ${userId}`,
            'SELF'
        );

        res.status(200).json({
            message: 'User history retrieved successfully',
            user: userWithHistory
        });
    } catch (error) {
        // Log the error
        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'ERROR',
            `Error retrieving history for user with ID ${userId}: ${error.message}`,
            'SELF',
            error.stack
        );

        console.error(error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
};
