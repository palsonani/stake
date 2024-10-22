import { Op } from "sequelize";
import Bet from "../../models/Bet.js";
import Games from "../../models/Games.js";
import Wallet from "../../models/Wallet.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import FinancialTransaction from "../../models/financialTransaction.js";
import { addLog } from "../../utility/logs.js";

export const updateWalletWithActiveStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const games = await Games.findAll({
            where: {
                isReload: 1
            }
        });

        const gameIds = games.map(item => item.id);

        const betData = await Bet.findAll({
            where: {
                userId,
                gameId: { [Op.in]: gameIds },
                isActive: 1
            }
        });

        const isActiveGame = betData.filter(item => item.winAmount > 0);
        if (isActiveGame.length === 0) {
            return res.status(400).json({
                message: "Not Found"
            });
        }

        for (const item of isActiveGame) {
            const wallet = await Wallet.findOne({
                where: {
                    userId
                }
            });

            const totalAmount = parseFloat(wallet.currentAmount) + parseFloat(item.winAmount);

            await Wallet.update(
                { currentAmount: parseFloat(totalAmount).toFixed(2) },
                { where: { id: wallet.id } }
            );

            await WalletTransaction.create({
                walletId: wallet.id,
                userId: userId,
                amount: item.winAmount,
                transactionType: 'win',
                transactionDirection: 'credit',
                description: `Won amount ${item.winAmount}`,
                transactionTime: new Date(),
            });

            await FinancialTransaction.create({
                gameId: item.gameId,
                walletId: wallet.id,
                userId,
                amount: item.winAmount,
                transactionType: 'win',
                transactionDirection: 'debit',
                description: `Won amount ${item.winAmount}`,
                transactionTime: new Date(),
            });

            await Bet.update(
                { isActive: 0 },
                { where: { id: item.id } }
            );
        }

        return res.status(200).json({
            message: "Wallet updated successfully",
        });
    } catch (error) {
        console.log(error);
        await addLog(
            "admin",
            'admin',
            'RetrieveFinancialTransactionError',
            `Error retrieving financial transaction history`,
            'walletTransaction'
        );
        return res.status(500).json({ error: 'Internal server error' });
    }
};
