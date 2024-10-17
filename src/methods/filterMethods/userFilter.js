import { Op } from 'sequelize';
import Wallet from '../../models/Wallet.js';
import Medal from '../../models/Medals.js';
import User from '../../models/user.js';
import FinancialTransaction from '../../models/financialTransaction.js';
import { addLog } from '../../utility/logs.js';

export const userFilter = async (req, res) => {
    const { isActive, country, minWalletBalance, minProfit, medalType } = req.query;

    try {
        const whereConditions = {};

        if (isActive !== undefined) {
            whereConditions.isActive = isActive === 'true';
        }

        if (country) {
            whereConditions.country = country;
        }

        const includeConditions = [];

        if (minWalletBalance) {
            includeConditions.push({
                model: Wallet,
                as: 'wallet',
                required: true,
                where: {
                    currentAmount: {
                        [Op.gte]: minWalletBalance,
                    },
                },
            });
        }

        if (minProfit) {
            includeConditions.push({
                model: FinancialTransaction,
                as: 'financialTransactions',
                required: true,
                where: {
                    profit: {
                        [Op.gte]: minProfit,
                    },
                },
            });
        }

        if (medalType) {
            includeConditions.push({
                model: Medal,
                as: 'medal',
                required: true,
                where: {
                    medalType: medalType,
                },
            });
        }

        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'INFO',
            `User filter request: isActive=${isActive}, country=${country}, minWalletBalance=${minWalletBalance}, minProfit=${minProfit}, medalType=${medalType}`,
            'SELF'
        );

        const users = await User.findAll({
            where: whereConditions,
            include: includeConditions,
            order: minProfit ? [
                [{ model: FinancialTransaction, as: 'financialTransactions' }, 'profit', 'DESC'],
            ] : [],
        });

        // Log successful response
        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'INFO',
            `User filter successful. Found ${users.length} users.`,
            'SELF'
        );

        res.status(200).json({ message: "Data Found", users });
    } catch (error) {
        // Log error details
        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'ERROR',
            `User filter error: ${error.message}`,
            'SELF',
            error.stack
        );

        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
