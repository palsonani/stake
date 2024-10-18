import { sequelize } from "../../config/connection.js";
import Bet from "../../models/Bet.js";
import User from "../../models/user.js";
import Games from "../../models/Games.js";
import { addLog } from "../../utility/logs.js";
const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};
export const getGameInformationOfUserById = async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Fetch user details
        const user = await User.findByPk(userId, {
            attributes: ['userName', 'email', 'country', 'createdAt']
        });

        if (!user) {
            await addLog(null, 'admin', 'ERROR', `User with ID ${userId} not found`, 'SELF');
            return res.status(404).json({ error: 'User not found' });
        }

        // Get current date and calculate the start of the week and last week
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

        // Fetch all bets placed by the user
        const userBets = await Bet.findAll({
            where: { userId },
            attributes: ['id', 'betAmount', 'winAmount', 'betTime', 'gameId'],
            include: [
                {
                    model: Games,
                    as: 'game', // Use the alias 'game'
                    attributes: ['gameName']
                }
            ]
        });

        // Initialize counters and totals
        let totalBets = 0;
        let totalAmountSpent = 0;
        let totalWinsAmount = 0;
        let highestBet = 0;
        let lowestBet = Infinity;
        let weeklyTotalBets = 0;
        let weeklyTotalAmountSpent = 0;
        let lastWeekTotalBets = 0;
        let lastWeekTotalAmountSpent = 0;
        let activeGames = new Set();

        // Initialize daily totals for the current week
        let currentWeekDailyTotals = {};
        for (let i = 0; i < 7; i++) {
            const dayOfCurrentWeek = new Date(startOfWeek);
            dayOfCurrentWeek.setDate(dayOfCurrentWeek.getDate() + i);
            const dayNameCurrentWeek = getDayName(dayOfCurrentWeek);
            currentWeekDailyTotals[dayNameCurrentWeek] = { bets: 0, amount: 0 };
        }

        // Initialize daily totals for last week
        let lastWeekDailyTotals = {};
        for (let i = 0; i < 7; i++) {
            const dayOfLastWeek = new Date(startOfLastWeek);
            dayOfLastWeek.setDate(dayOfLastWeek.getDate() + i);
            const dayNameLastWeek = getDayName(dayOfLastWeek);
            lastWeekDailyTotals[dayNameLastWeek] = { bets: 0, amount: 0 };
        }

        // Initialize time-of-day totals
        let timeOfDayTotals = {
            morning: { bets: 0, amount: 0 },  // 6 AM - 12 PM
            afternoon: { bets: 0, amount: 0 }, // 12 PM - 6 PM
            evening: { bets: 0, amount: 0 },   // 6 PM - 12 AM
            night: { bets: 0, amount: 0 }      // 12 AM - 6 AM
        };


        // Process each bet
        userBets.forEach(bet => {
            const betDate = new Date(bet.betTime);
            const betAmount = parseFloat(bet.betAmount) || 0;

            // Update totals (existing logic)
            totalBets += 1;
            totalAmountSpent += betAmount;
            highestBet = Math.max(highestBet, betAmount);
            lowestBet = Math.min(lowestBet, betAmount);
            // if (bet.winAmount && bet.winAmount > 0) {
            //     totalWinsAmount += parseFloat(bet.winAmount - bet.betAmount);
            // }
            if(bet.betAmount){
                totalWinsAmount += parseFloat(bet.winAmount - bet.betAmount);
            }

            activeGames.add(bet.gameId);

            // Calculate weekly totals for the current week
            if (betDate >= startOfWeek) {
                weeklyTotalBets += 1;
                weeklyTotalAmountSpent += betAmount;
                const dayName = getDayName(betDate);
                currentWeekDailyTotals[dayName].bets += 1;
                currentWeekDailyTotals[dayName].amount += betAmount;
            }

            // Calculate last week's daily totals
            if (betDate >= startOfLastWeek && betDate < startOfWeek) {
                lastWeekTotalBets += 1;
                lastWeekTotalAmountSpent += betAmount;
                const dayNameLastWeek = getDayName(betDate);
                lastWeekDailyTotals[dayNameLastWeek].bets += 1;
                lastWeekDailyTotals[dayNameLastWeek].amount += betAmount;
            }

            // Calculate time-of-day totals
            const hour = betDate.getHours();
            if (hour >= 6 && hour < 12) {
                timeOfDayTotals.morning.bets += 1;
                timeOfDayTotals.morning.amount += betAmount;
            } else if (hour >= 12 && hour < 18) {
                timeOfDayTotals.afternoon.bets += 1;
                timeOfDayTotals.afternoon.amount += betAmount;
            } else if (hour >= 18 && hour < 24) {
                timeOfDayTotals.evening.bets += 1;
                timeOfDayTotals.evening.amount += betAmount;
            } else {
                timeOfDayTotals.night.bets += 1;
                timeOfDayTotals.night.amount += betAmount;
            }
        });


        // Calculate increment percentage
        const incrementPercentage = lastWeekTotalAmountSpent > 0
            ? (((weeklyTotalAmountSpent - lastWeekTotalAmountSpent) / lastWeekTotalAmountSpent) * 100).toFixed(2)
            : 'N/A';

        // Calculate win/loss ratio
        const winRatio = totalAmountSpent > 0 ? Math.max((totalWinsAmount / totalAmountSpent) * 100, 0) : 0;
        const roundedWinRatio = winRatio.toFixed(2);
        const lossRatio = totalAmountSpent > 0 ? Math.max((100 - winRatio), 0).toFixed(2) : 0;


        // Calculate average bet amount
        const averageBetAmount = totalBets > 0 ? (totalAmountSpent / totalBets).toFixed(2) : 'N/A';

        // Log the action
        await addLog(null, 'admin', 'INFO', `Retrieved information for user ID ${userId}`, 'SELF');

        const topGames = await Bet.findAll({
            where: { userId },
            attributes: [
                'gameId',
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.literal('winAmount - betAmount')
                    ),
                    'totalWinAmount'
                ]
            ],
            group: ['gameId'],
            order: [[sequelize.literal('totalWinAmount'), 'DESC']],
            limit: 3,
            include: [
                {
                    model: Games,
                    as: 'game',
                    attributes: ['gameName']
                }
            ]
        });

        res.status(200).json({
            message: `User information retrieved successfully for user ID ${userId}`,
            user,
            totalBets,
            totalWinsAmount: totalWinsAmount.toFixed(2),
            totalAmountSpent: totalAmountSpent.toFixed(2),
            highestBetAmount: highestBet.toFixed(2),
            lowestBetAmount: lowestBet.toFixed(2),
            averageBetAmount,
            weeklyTotalBets,
            weeklyTotalAmountSpent: weeklyTotalAmountSpent.toFixed(2),
            lastWeekTotalBets,
            lastWeekTotalAmountSpent: lastWeekTotalAmountSpent.toFixed(2),
            incrementPercentage,
            currentWeekDailyTotals,
            lastWeekDailyTotals,  // Add last week's daily totals
            timeOfDayTotals,      // Add time-of-day totals
            winRatio: roundedWinRatio,
            lossRatio: lossRatio,
            activeGameCount: activeGames.size,
            topGames
        });

    } catch (error) {
        // Log the error
        await addLog(null, 'admin', 'ERROR', `Error retrieving information for user ID ${userId}: ${error.message}`, 'SELF');

        console.error(error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
    
};