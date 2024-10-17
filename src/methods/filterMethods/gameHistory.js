import Bet from "../../models/Bet.js";
import Games from "../../models/Games.js";
import { Op } from 'sequelize';
import { addLog } from '../utils/addLog.js'; // Assuming addLog is in utils

export const getGameHistoryById = async (req, res) => {
    const gameId = parseInt(req.params.gameId);

    if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
    }

    try {
        
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

        // Fetch game details
        const game = await Games.findByPk(gameId);
        if (!game) {
            await addLog(null, 'admin', 'ERROR', `Game with ID ${gameId} not found`, 'SELF');
            return res.status(404).json({ error: 'Game not found' });
        }   

        // Fetch bets for the specific game
        const bets = await Bet.findAll({
            where: { gameId },
            attributes: ['id', 'betAmount', 'winAmount', 'betTime', 'userId']
        });

        // Calculate totals and increment percentages
        let totalBets = 0;
        let totalWinsAmount = 0;
        let totalAmountSpent = 0;

        let dailyTotalBets = 0;
        let dailyTotalAmountSpent = 0;
        let weeklyTotalBets = 0;
        let weeklyTotalAmountSpent = 0;
        let monthlyTotalBets = 0;
        let monthlyTotalAmountSpent = 0;

        // Set to keep track of unique users
        const userIds = new Set();

        // Process each bet
        bets.forEach(bet => {
            const betDate = new Date(bet.betTime);

            totalBets += 1;
            totalAmountSpent += parseFloat(bet.betAmount) || 0;
            if (bet.winAmount && bet.winAmount > 0) {
                totalWinsAmount += parseFloat(bet.winAmount);
            }

            // Add userId to the set
            userIds.add(bet.userId);

            // Calculate daily, weekly, and monthly totals
            if (betDate.toDateString() === today.toDateString()) {
                dailyTotalBets += 1;
                dailyTotalAmountSpent += parseFloat(bet.betAmount) || 0;
            }

            if (betDate >= startOfWeek) {
                weeklyTotalBets += 1;
                weeklyTotalAmountSpent += parseFloat(bet.betAmount) || 0;
            }

            if (betDate >= startOfLastWeek && betDate < startOfWeek) {
                monthlyTotalBets += 1;
                monthlyTotalAmountSpent += parseFloat(bet.betAmount) || 0;
            }
        });

        // Get totals for last week for comparison
        const lastWeekBets = await Bet.findAll({
            where: {
                gameId,
                betTime: {
                    [Op.between]: [startOfLastWeek, endOfLastWeek]
                }
            }
        });

        let lastWeekTotalBets = 0;
        let lastWeekTotalAmountSpent = 0;
        lastWeekBets.forEach(bet => {
            lastWeekTotalBets += 1;
            lastWeekTotalAmountSpent += parseFloat(bet.betAmount) || 0;
        });

        // Calculate increment percentage
        const incrementPercentage = lastWeekTotalAmountSpent > 0
            ? (((weeklyTotalAmountSpent - lastWeekTotalAmountSpent) / lastWeekTotalAmountSpent) * 100).toFixed(2)
            : 'N/A';

        // Calculate overall profit (totalWinsAmount - totalAmountSpent)
        const overallProfit = totalWinsAmount - totalAmountSpent;

        const winRatio = totalBets > 0 ? ((totalWinsAmount / totalBets) * 100).toFixed(2) : '0.00';
        const lossRatio = totalBets > 0 ? (((totalBets - totalWinsAmount) / totalBets) * 100).toFixed(2) : '0.00';
        console.log(winRatio,overallProfit)
        // Log the action
        await addLog(null, 'admin', 'INFO', `Retrieved history for game ID ${gameId}`, 'SELF');

        res.status(200).json({
            message: `Game history retrieved successfully for game ID ${gameId}`,
            game,
            totalBets,
            totalWinsAmount: totalWinsAmount.toFixed(2),
            totalAmountSpent: totalAmountSpent.toFixed(2),
            overallProfit: overallProfit.toFixed(2),
            dailyTotalBets,
            dailyTotalAmountSpent: dailyTotalAmountSpent.toFixed(2),
            weeklyTotalBets,
            weeklyTotalAmountSpent: weeklyTotalAmountSpent.toFixed(2),
            monthlyTotalBets,
            monthlyTotalAmountSpent: monthlyTotalAmountSpent.toFixed(2),
            incrementPercentage,
            playerCount: userIds.size,  // Number of unique users
            winRatio,
            lossRatio
        });
    } catch (error) {
        // Log the error
        await addLog(null, 'admin', 'ERROR', `Error retrieving game history for game ID ${gameId}: ${error.message}`, 'SELF');

        console.error(error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
};
