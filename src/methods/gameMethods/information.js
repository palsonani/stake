import Bet from "../../models/Bet.js";
import Games from "../../models/Games.js";
import { Op } from 'sequelize';
import { addLog } from "../../utility/logs.js";
import User from "../../models/user.js";

// Utility function to get day name
const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};

// Utility function to get time of day
const getTimeOfDay = (date) => {
    const hour = date.getHours();
    if (hour < 6) return 'Midnight to 6 AM';
    if (hour < 12) return '6 AM to Noon';
    if (hour < 18) return 'Noon to 6 PM';
    return '6 PM to Midnight';
};

export const getGameInformation = async (req, res) => {
    const gameId = parseInt(req.params.gameId);

    if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });

    }

    try {
        const io = req.crashIo;
        const livePlayerRoom = `game_${gameId}`;
        const livePlayerCount = io.sockets.adapter.rooms.get(livePlayerRoom)?.size || 0;
        console.log(livePlayerCount, livePlayerRoom);

        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);


        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Fetch game details
        const game = await Games.findByPk(gameId);
        if (!game) {
            await addLog(null, 'admin', 'ERROR', `Game with ID ${gameId} not found`, 'SELF');
            return res.status(404).json({ error: 'Game not found' });
        }

        // Fetch bets for the specific game
        const bets = await Bet.findAll({
            where: { gameId },
            attributes: ['id', 'betAmount', 'winAmount', 'betTime', 'userId'],
            include: [
                {
                    model: User,
                    as: 'user', // Use the alias 'user'
                    attributes: ['userName', 'country']
                }
            ]
        });

        // Initialize counters and containers
        let totalBets = 0;
        let totalWinsAmount = 0;
        let totalAmountSpent = 0;
        let highestBet = 0;
        let lowestBet = Infinity;

        let dailyTotalBets = 0;
        let dailyTotalAmountSpent = 0;

        let weeklyTotalBets = 0;
        let weeklyTotalAmountSpent = 0;

        let lastWeekDailyTotals = {};
        let currentWeekDailyTotals = {};

        let monthlyTotalBets = 0;
        let monthlyTotalAmountSpent = 0;

        let activeUsers = new Set();
        let inactiveUsers = new Set();

        const userIds = new Set();
        const playerTotals = {};
        const timeOfDayTotals = {
            'Midnight to 6 AM': { bets: 0, amount: 0 },
            '6 AM to Noon': { bets: 0, amount: 0 },
            'Noon to 6 PM': { bets: 0, amount: 0 },
            '6 PM to Midnight': { bets: 0, amount: 0 }
        };
        const betSizeDistribution = {
            'Low': 0,//Low (< $10)
            'Medium': 0,//Medium ($10 - $100)
            'High': 0//High (> $100)
        };

        // Initialize daily totals for last week and current week
        for (let i = 0; i < 7; i++) {
            const dayOfLastWeek = new Date(startOfLastWeek);
            dayOfLastWeek.setDate(dayOfLastWeek.getDate() + i);
            const dayOfCurrentWeek = new Date(startOfWeek);
            dayOfCurrentWeek.setDate(dayOfCurrentWeek.getDate() + i);

            const dayNameLastWeek = getDayName(dayOfLastWeek);
            const dayNameCurrentWeek = getDayName(dayOfCurrentWeek);

            lastWeekDailyTotals[dayNameLastWeek] = { bets: 0, amount: 0 };
            currentWeekDailyTotals[dayNameCurrentWeek] = { bets: 0, amount: 0 };
        }

        // Process each bet
        bets.forEach(bet => {
            const betDate = new Date(bet.betTime);

            totalBets += 1;
            const betAmount = parseFloat(bet.betAmount) || 0;
            totalAmountSpent += betAmount;
            highestBet = Math.max(highestBet, betAmount);
            lowestBet = Math.min(lowestBet, betAmount);

            if (bet.winAmount && bet.winAmount > 0) {
                totalWinsAmount += parseFloat(bet.winAmount);
            }

            userIds.add(bet.userId);

            if (betDate >= thirtyDaysAgo) {
                activeUsers.add(bet.userId);
            } else {
                inactiveUsers.add(bet.userId);
            }

            // Track player totals
            const username = bet.User ? bet.User.userName : 'Unknown';
            playerTotals[bet.userId] = playerTotals[bet.userId] || { userName: username, totalSpent: 0, totalWon: 0 };
            playerTotals[bet.userId].totalSpent += betAmount;
            if (bet.winAmount && bet.winAmount > 0) {
                playerTotals[bet.userId].totalWon += parseFloat(bet.winAmount);
            }

            // Calculate daily totals
            if (betDate.toDateString() === today.toDateString()) {
                dailyTotalBets += 1;
                dailyTotalAmountSpent += betAmount;
            }

            // Calculate weekly totals
            if (betDate >= startOfWeek) {
                weeklyTotalBets += 1;
                weeklyTotalAmountSpent += betAmount;
                const dayName = getDayName(betDate);
                currentWeekDailyTotals[dayName] = (currentWeekDailyTotals[dayName] || { bets: 0, amount: 0 });
                currentWeekDailyTotals[dayName].bets += 1;
                currentWeekDailyTotals[dayName].amount += betAmount;
            }

            // Calculate last week totals
            if (betDate >= startOfLastWeek && betDate < startOfWeek) {
                monthlyTotalBets += 1;
                monthlyTotalAmountSpent += betAmount;
                const dayName = getDayName(betDate);
                lastWeekDailyTotals[dayName] = (lastWeekDailyTotals[dayName] || { bets: 0, amount: 0 });
                lastWeekDailyTotals[dayName].bets += 1;
                lastWeekDailyTotals[dayName].amount += betAmount;
            }

            // Calculate time of day totals
            const timeOfDay = getTimeOfDay(betDate);
            timeOfDayTotals[timeOfDay].bets += 1;
            timeOfDayTotals[timeOfDay].amount += betAmount;

            // Calculate bet size distribution
            if (betAmount < 10) {
                betSizeDistribution['Low'] += 1;
            } else if (betAmount <= 100) {
                betSizeDistribution['Medium'] += 1;
            } else {
                betSizeDistribution['High'] += 1;
            }
        });

        inactiveUsers = new Set([...inactiveUsers].filter(userId => !activeUsers.has(userId)));

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

        // Calculate win/loss ratios
        const winRatio = totalBets > 0 ? (totalWinsAmount / totalAmountSpent) * 100 : 0;
        const lossRatio = totalBets > 0 ? (1 - (totalWinsAmount / totalAmountSpent)) * 100 : 100;

        // Ensure winRatio and lossRatio add up to 100%
        const roundedWinRatio = winRatio.toFixed(2);
        const roundedLossRatio = (100 - winRatio).toFixed(2);

        // Calculate average bet amount
        const averageBetAmount = totalBets > 0 ? (totalAmountSpent / totalBets).toFixed(2) : 'N/A';

        // Sort players by total winnings and get the top 10
        const topPlayers = Object.entries(playerTotals)
            .map(([userId, totals]) => {
                const userBet = bets.find(bet => bet.userId === parseInt(userId));
                const userName = userBet ? userBet.user.userName : 'Unknown';

                return {
                    userId,
                    userName,
                    totalSpent: totals.totalSpent.toFixed(2),
                    totalWon: totals.totalWon.toFixed(2),
                    netGain: (totals.totalWon - totals.totalSpent).toFixed(2)
                };
            })
            .sort((a, b) => b.totalWon - a.totalWon) // Sort by totalWon in descending order
            .slice(0, 10); // Top 10 players

        // Calculate player counts by country
        const playerCountsByCountry = {};
        for (const userId of userIds) {
            const user = await User.findByPk(userId); // Adjust according to your model relationships
            const country = user?.country || 'Unknown';
            playerCountsByCountry[country] = (playerCountsByCountry[country] || 0) + 1;
        }

        // Log the action
        await addLog(null, 'admin', 'INFO', `Retrieved history for game ID ${gameId}`, 'SELF');

        res.status(200).json({
            message: `Game history retrieved successfully for game ID ${gameId}`,
            game,
            totalBets,
            totalWinsAmount: totalWinsAmount.toFixed(2),
            totalAmountSpent: totalAmountSpent.toFixed(2),
            highestBetAmount: highestBet.toFixed(2),
            lowestBetAmount: lowestBet.toFixed(2),
            averageBetAmount,
            dailyTotalBets,
            dailyTotalAmountSpent: dailyTotalAmountSpent.toFixed(2),
            weeklyTotalBets,
            weeklyTotalAmountSpent: weeklyTotalAmountSpent.toFixed(2),
            monthlyTotalBets,
            monthlyTotalAmountSpent: monthlyTotalAmountSpent.toFixed(2),
            activeUserCount: activeUsers.size,
            inactiveUserCount: inactiveUsers.size,
            incrementPercentage,
            playerCount: userIds.size,
            lastWeekDailyTotals,
            currentWeekDailyTotals,
            timeOfDayTotals,
            betSizeDistribution,
            topPlayers,
            winRatio: roundedWinRatio,
            lossRatio: roundedLossRatio,
            livePlayerCount,
            playerCountsByCountry
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
