import { sequelize } from "../../config/connection.js";
import Bet from "../../models/Bet.js";
import Commission from "../../models/Commission.js";
import Games from "../../models/Games.js";
import Medal from "../../models/Medals.js";
import Pull from "../../models/Pull.js";
import PullPlayer from "../../models/PullPlayer.js";
import User from "../../models/user.js";
import Wallet from "../../models/Wallet.js";
import { Op } from 'sequelize';
import moment from 'moment';
import { addLog } from "../../utility/logs.js";

export const adminDashbord = async (req, res) => {
    try {
        // Log the start of the dashboard data retrieval
        await addLog(null, 'admin', 'DASHBOARD_ACCESS', 'Started retrieving dashboard data');

        // User Stats
        const userStats = await User.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
                [sequelize.literal(`COALESCE(SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END), 0)`), 'activeUsers'],
                [sequelize.literal(`COALESCE(SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END), 0)`), 'inactiveUsers']
            ]
        });
        await addLog(null, 'admin', 'USER_STATS_RETRIEVED', 'User statistics retrieved successfully');

        // Bet Stats
        const betStats = await Bet.findAll({
            attributes: [
                [sequelize.literal('COALESCE(SUM(betAmount), 0)'), 'totalBetAmount'],
                [sequelize.literal('COALESCE(SUM(profitOnWin), 0)'), 'totalProfit'],
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalBets'],
                'betType'
            ],
            group: ['betType']
        });
        await addLog(null, 'admin', 'BET_STATS_RETRIEVED', 'Bet statistics retrieved successfully');

        // Game Stats
        const gameStats = await Games.findAll({
            attributes: [
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalGames'],
                [sequelize.literal(`COALESCE(SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END), 0)`), 'activeGames'],
                'gameType'
            ],
            group: ['gameType']
        });
        await addLog(null, 'admin', 'GAME_STATS_RETRIEVED', 'Game statistics retrieved successfully');

        // Commission Stats
        const commissionStats = await Commission.findAll({
            attributes: [
                [sequelize.literal('COALESCE(SUM(commissionPercentage), 0)'), 'totalCommission'],
                [sequelize.literal('COALESCE(COUNT(Commission.id), 0)'), 'totalCommissionRecords'],
                'gameId'
            ],
            include: [{ model: Games, as: 'game', attributes: ['gameName'] }],
            group: ['gameId']
        });
        await addLog(null, 'admin', 'COMMISSION_STATS_RETRIEVED', 'Commission statistics retrieved successfully');

        // Medal Stats
        const medalStats = await Medal.findAll({
            attributes: [
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalMedals'],
                'medalType', 'medalLevel'
            ],
            group: ['medalType', 'medalLevel']
        });
        await addLog(null, 'admin', 'MEDAL_STATS_RETRIEVED', 'Medal statistics retrieved successfully');

        // Pull Stats
        const pullStats = await Pull.findAll({
            attributes: [
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalPulls'],
                [sequelize.literal('COALESCE(AVG(crashPoint), 0)'), 'averageCrashPoint']
            ]
        });
        await addLog(null, 'admin', 'PULL_STATS_RETRIEVED', 'Pull statistics retrieved successfully');

        // Pull Player Daily Stats
        const today = moment().startOf('day').toDate();
        const pullPlayerDailyStats = await PullPlayer.findAll({
            attributes: [
                [sequelize.literal('COALESCE(SUM(amount), 0)'), 'totalAmountBet'],
                [sequelize.literal('COALESCE(SUM(winAmount), 0)'), 'totalWinAmount'],
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalPlayers'],
                [sequelize.literal('COALESCE(SUM(isWinner), 0)'), 'totalWinners'],
                [sequelize.literal('COALESCE(COUNT(id) - SUM(isWinner), 0)'), 'totalLosers']
            ],
            where: {
                pullTime: {
                    [Op.gte]: today
                }
            }
        });
        await addLog(null, 'admin', 'PULL_PLAYER_DAILY_STATS_RETRIEVED', 'Pull player daily statistics retrieved successfully');

        // Pull Player Weekly Stats
        const startOfWeek = moment().startOf('week').toDate();
        const pullPlayerWeeklyStats = await PullPlayer.findAll({
            attributes: [
                [sequelize.literal('COALESCE(SUM(amount), 0)'), 'totalAmountBet'],
                [sequelize.literal('COALESCE(SUM(winAmount), 0)'), 'totalWinAmount'],
                [sequelize.literal('COALESCE(COUNT(id), 0)'), 'totalPlayers'],
                [sequelize.literal('COALESCE(SUM(isWinner), 0)'), 'totalWinners'],
                [sequelize.literal('COALESCE(COUNT(id) - SUM(isWinner), 0)'), 'totalLosers']
            ],
            where: {
                pullTime: {
                    [Op.gte]: startOfWeek
                }
            }
        });
        await addLog(null, 'admin', 'PULL_PLAYER_WEEKLY_STATS_RETRIEVED', 'Pull player weekly statistics retrieved successfully');

        // Wallet Stats
        const walletStats = await Wallet.findAll({
            attributes: [
                [sequelize.literal('COALESCE(SUM(totalAmount), 0)'), 'totalBalance'],
                [sequelize.literal('COALESCE(AVG(currentAmount), 0)'), 'averageCurrentBalance'],
                [sequelize.literal('COALESCE(MAX(currentAmount), 0)'), 'maxBalance'],
                [sequelize.literal('COALESCE(MIN(currentAmount), 0)'), 'minBalance']
            ]
        });
        await addLog(null, 'admin', 'WALLET_STATS_RETRIEVED', 'Wallet statistics retrieved successfully');

        // Combine all stats into a single response
        res.json({
            userStats,
            betStats,
            gameStats,
            commissionStats,
            medalStats,
            pullStats,
            pullPlayerDailyStats,
            pullPlayerWeeklyStats,
            walletStats
        });

        // Log the successful completion of the dashboard data retrieval
        await addLog(null, 'admin', 'DASHBOARD_ACCESS_COMPLETED', 'Successfully retrieved all dashboard data');
    } catch (error) {
        // Log the error
        await addLog(null, 'admin', 'DASHBOARD_ERROR', `Error retrieving dashboard data: ${error.message}`, 'SELF');
        res.status(500).json({ error: 'Internal Server Error' });
        console.log(error);
    }
};
