import Pull from '../../models/Pull.js';
import PullPlayer from '../../models/PullPlayer.js';
import User from '../../models/user.js';
import { Op, Sequelize } from 'sequelize';
import { addLog } from '../../utility/logs.js';
import Bet from '../../models/Bet.js';

// export const getGameHistory = async (req, res) => {
//     try {
//         const { gameId } = req.params;
//         // Extract pagination parameters 
//         const { page = 1, limit = 10 } = req.query;

//         // Validate pagination parameters
//         const pageNumber = parseInt(page, 10);
//         const pageSize = parseInt(limit, 10);

//         if (!gameId) {
//             return res.status(400).json({ message: "gameId is required" });
//         }

//         if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
//             return res.status(400).json({ message: "Invalid pagination parameters" });
//         }

//         // Log the attempt to find crash game history with pagination
//         await Logs.create({
//             userId: null, 
//             action: `Find crash game history by gameId attempt - Game ID: ${gameId}, Page: ${pageNumber}, Limit: ${pageSize}`,
//             logTime: new Date(),
//         });

//         // Calculate offset for pagination
//         const offset = (pageNumber - 1) * pageSize;

//         // Retrieve all pulls for the specified gameId with pagination
//         const pulls = await Pull.findAll({
//             where: { gameId },
//             limit: pageSize,
//             offset: offset,
//             order: [['pullTime', 'DESC']] 
//         });

//         // Aggregate data for each pull
//         const pullHistories = await Promise.all(pulls.map(async (pull) => {
//             const pullPlayers = await PullPlayer.findAll({
//                 where: { pullId: pull.id },
//                 include: [{ model: User, as: 'User', attributes: ['userName'] }] // Use the correct alias 'User'
//             });
//             const totalPullAmount = pullPlayers.reduce((sum, player) => sum + player.amount, 0);
//             const totalWinAmount = pullPlayers.reduce((sum, player) => player.isWinner ? sum + player.winAmount : sum, 0);
//             const totalLossAmount = totalPullAmount - totalWinAmount;

//             // Add totalLossAmount to each player
//             const playersWithLosses = pullPlayers.map(player => ({
//                 ...player.toJSON(), 
//                 playerName: player.User ? player.User.userName : null,
//                 lossAmount: !player.isWinner ? totalLossAmount : 0, 
//                 winAmount: player.winAmount || 0 
//             }));
//             playersWithLosses.forEach(player => delete player.User);
//             return {
//                 pullId: pull.id,
//                 gameId: pull.gameId,
//                 crashPoint: pull.crashPoint,
//                 pullTime: pull.pullTime,
//                 playerCount: pullPlayers.length,
//                 totalPullAmount,
//                 // totalWinAmount,
//                 // totalLossAmount,
//                 players: playersWithLosses
//             };
//         }));

//         // Count the total number of pulls for pagination info
//         const totalPulls = await Pull.count({ where: { gameId } });

//         // Log successful retrieval of crash game history
//         await Logs.create({
//             userId: null,
//             action: `Crash game history retrieved successfully for gameId: ${gameId} - Page: ${pageNumber}, Limit: ${pageSize}, Total Pulls: ${totalPulls}`,
//             logTime: new Date(),
//         });

//         res.status(200).json({
//             message: "Data found",
//             totalPulls,
//             totalPages: Math.ceil(totalPulls / pageSize),
//             currentPage: pageNumber,
//             pulls: pullHistories
//         });
//     } catch (error) {
//         console.error(error);
//         await Logs.create({
//             userId: null,
//             action: `Error retrieving crash game history by gameId: ${error.message}`,
//             logTime: new Date(),
//             details: error.stack,
//         });
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

// export const getGameHistory = async (req, res) => {
//     try {
//         const { gameId } = req.params;
//         // Extract pagination and filtering parameters 
//         const { page = 1, limit = 10, pullId, crashPoint, crashPointOperator, winAmount, winAmountOperator, startDate, endDate, playerCount, playerCountOperator, sortBy = 'pullTime', sortOrder = 'DESC' } = req.query;

//         // Validate pagination parameters
//         const pageNumber = parseInt(page, 10);
//         const pageSize = parseInt(limit, 10);

//         if (!gameId) {
//             return res.status(400).json({ message: "gameId is required" });
//         }

//         if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
//             return res.status(400).json({ message: "Invalid pagination parameters" });
//         }

//         if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
//             return res.status(400).json({ message: "Invalid sort order" });
//         }

//         // Log the attempt to find crash game history with pagination and filters
//         await Logs.create({
//             userId: null, 
//             action: `Find crash game history by gameId attempt - Game ID: ${gameId}, Page: ${pageNumber}, Limit: ${pageSize}, Filters: ${JSON.stringify(req.query)}`,
//             logTime: new Date(),
//         });

//         // Calculate offset for pagination
//         const offset = (pageNumber - 1) * pageSize;

//         // Build the filter conditions
//         let whereConditions = { gameId };

//         if (pullId) whereConditions.id = pullId;

//         if (crashPoint) {
//             whereConditions.crashPoint = {};
//             switch (crashPointOperator) {
//                 case '>':
//                     whereConditions.crashPoint[Op.gt] = parseFloat(crashPoint);
//                     break;
//                 case '<':
//                     whereConditions.crashPoint[Op.lt] = parseFloat(crashPoint);
//                     break;
//                 case '=':
//                     whereConditions.crashPoint[Op.eq] = parseFloat(crashPoint);
//                     break;
//             }
//         }

//         if (winAmount) {
//             whereConditions['$PullPlayers.winAmount$'] = {};
//             switch (winAmountOperator) {
//                 case '>':
//                     whereConditions['$PullPlayers.winAmount$'][Op.gt] = parseFloat(winAmount);
//                     break;
//                 case '<':
//                     whereConditions['$PullPlayers.winAmount$'][Op.lt] = parseFloat(winAmount);
//                     break;
//                 case '=':
//                     whereConditions['$PullPlayers.winAmount$'][Op.eq] = parseFloat(winAmount);
//                     break;
//             }
//         }

//         if (startDate) whereConditions.pullTime = { [Op.gte]: new Date(startDate) };
//         if (endDate) whereConditions.pullTime = { [Op.lte]: new Date(endDate) };

//         // Handle playerCount filtering
//         if (playerCount) {
//             whereConditions['$PullPlayers.playerCount$'] = {};
//             switch (playerCountOperator) {
//                 case '>':
//                     whereConditions['$PullPlayers.playerCount$'][Op.gt] = parseInt(playerCount, 10);
//                     break;
//                 case '<':
//                     whereConditions['$PullPlayers.playerCount$'][Op.lt] = parseInt(playerCount, 10);
//                     break;
//                 case '=':
//                     whereConditions['$PullPlayers.playerCount$'][Op.eq] = parseInt(playerCount, 10);
//                     break;
//             }
//         }

//         // Retrieve all pulls for the specified gameId with filters, pagination, and sorting
//         const pulls = await Pull.findAll({
//             where: whereConditions,
//             limit: pageSize,
//             offset: offset,
//             order: [[sortBy, sortOrder]],
//             include: [{
//                 model: PullPlayer,
//                 attributes: [], // No attributes needed from PullPlayer for this query
//                 required: true
//             }]
//         });

//         // Aggregate data for each pull
//         const pullHistories = await Promise.all(pulls.map(async (pull) => {
//             const pullPlayers = await PullPlayer.findAll({
//                 where: { pullId: pull.id },
//                 include: [{ model: User, as: 'User', attributes: ['userName'] }]
//             });
//             const totalPullAmount = pullPlayers.reduce((sum, player) => sum + player.amount, 0);
//             const totalWinAmount = pullPlayers.reduce((sum, player) => player.isWinner ? sum + player.winAmount : sum, 0);
//             const totalLossAmount = totalPullAmount - totalWinAmount;

//             const playersWithLosses = pullPlayers.map(player => ({
//                 ...player.toJSON(), 
//                 playerName: player.User ? player.User.userName : null,
//                 lossAmount: !player.isWinner ? totalLossAmount : 0, 
//                 winAmount: player.winAmount || 0 
//             }));
//             playersWithLosses.forEach(player => delete player.User);
//             return {
//                 pullId: pull.id,
//                 gameId: pull.gameId,
//                 crashPoint: pull.crashPoint,
//                 pullTime: pull.pullTime,
//                 playerCount: pullPlayers.length,
//                 totalPullAmount,
//                 totalWinAmount,
//                 totalLossAmount,
//                 players: playersWithLosses
//             };
//         }));

//         // Count the total number of pulls for pagination info
//         const totalPulls = await Pull.count({ where: whereConditions });

//         // Log successful retrieval of crash game history
//         await Logs.create({
//             userId: null,
//             action: `Crash game history retrieved successfully for gameId: ${gameId} - Page: ${pageNumber}, Limit: ${pageSize}, Total Pulls: ${totalPulls}`,
//             logTime: new Date(),
//         });

//         res.status(200).json({
//             message: "Data found",
//             totalPulls,
//             totalPages: Math.ceil(totalPulls / pageSize),
//             currentPage: pageNumber,
//             pulls: pullHistories
//         });
//     } catch (error) {
//         console.error(error);
//         await Logs.create({
//             userId: null,
//             action: `Error retrieving crash game history by gameId: ${error.message}`,
//             logTime: new Date(),
//             details: error.stack,
//         });
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

// export const getGameHistory = async (req, res) => {
//     try {
//         const { gameId } = req.params;
//         // Extract pagination and filtering parameters 
//         const { page = 1, limit = 10, pullId, crashPoint, crashPointOperator, winAmount, winAmountOperator, startDate, endDate, playerCount, playerCountOperator, sortBy = 'pullTime', sortOrder = 'DESC' } = req.query;

//         // Validate pagination parameters
//         const pageNumber = parseInt(page, 10);
//         const pageSize = parseInt(limit, 10);

//         if (!gameId) {
//             return res.status(400).json({ message: "gameId is required" });
//         }

//         if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
//             return res.status(400).json({ message: "Invalid pagination parameters" });
//         }

//         if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
//             return res.status(400).json({ message: "Invalid sort order" });
//         }

//         // Log the attempt to find crash game history with pagination and filters
//         await Logs.create({
//             userId: null, 
//             action: `Find crash game history by gameId attempt - Game ID: ${gameId}, Page: ${pageNumber}, Limit: ${pageSize}, Filters: ${JSON.stringify(req.query)}`,
//             logTime: new Date(),
//         });

//         // Calculate offset for pagination
//         const offset = (pageNumber - 1) * pageSize;

//         // Build the filter conditions
//         let whereConditions = { gameId };

//         if (pullId) whereConditions.id = pullId;

//         if (crashPoint) {
//             whereConditions.crashPoint = {};
//             switch (crashPointOperator) {
//                 case '>':
//                     whereConditions.crashPoint[Op.gt] = parseFloat(crashPoint);
//                     break;
//                 case '<':
//                     whereConditions.crashPoint[Op.lt] = parseFloat(crashPoint);
//                     break;
//                 case '=':
//                     whereConditions.crashPoint[Op.eq] = parseFloat(crashPoint);
//                     break;
//             }
//         }

//         if (startDate) whereConditions.pullTime = { [Op.gte]: new Date(startDate) };
//         if (endDate) whereConditions.pullTime = { [Op.lte]: new Date(endDate) };

//         // Build a subquery to filter pulls based on total win amount from players
//         let havingConditions = {};
//         if (winAmount) {
//             let operator = null;
//             switch (winAmountOperator) {
//                 case '>':
//                     operator = Op.gt;
//                     break;
//                 case '<':
//                     operator = Op.lt;
//                     break;
//                 case '=':
//                     operator = Op.eq;
//                     break;
//                 default:
//                     return res.status(400).json({ message: 'Invalid winAmountOperator' });
//             }
//             havingConditions['totalWinAmount'] = { [operator]: parseFloat(winAmount) };
//         }

//         // Handle playerCount filtering using subquery aggregation
//         if (playerCount) {
//             havingConditions['playerCount'] = {};
//             switch (playerCountOperator) {
//                 case '>':
//                     havingConditions['playerCount'][Op.gt] = parseInt(playerCount, 10);
//                     break;
//                 case '<':
//                     havingConditions['playerCount'][Op.lt] = parseInt(playerCount, 10);
//                     break;
//                 case '=':
//                     havingConditions['playerCount'][Op.eq] = parseInt(playerCount, 10);
//                     break;
//             }
//         }

//         // Retrieve all pulls for the specified gameId with filters, pagination, and sorting
//         const pulls = await Pull.findAll({
//             where: whereConditions,
//             attributes: [
//                 'id', 'gameId', 'crashPoint', 'pullTime',
//                 // Use Sequelize to calculate the totalWinAmount and playerCount for each pull
//                 [Sequelize.fn('SUM', Sequelize.col('PullPlayers.winAmount')), 'totalWinAmount'],
//                 [Sequelize.fn('COUNT', Sequelize.col('PullPlayers.id')), 'playerCount'],
//             ],
//             include: [{
//                 model: PullPlayer,
//                 attributes: [], // No attributes needed from PullPlayer for this query
//                 required: true
//             }],
//             group: ['Pull.id'], // Group by Pull ID to aggregate the data
//             having: havingConditions, // Apply the having conditions for winAmount and playerCount
//             limit: pageSize,
//             offset: offset,
//             order: [[sortBy, sortOrder]],
//             subQuery: false // Ensures proper grouping without the subquery limitation
//         });

//         // Aggregate data for each pull
//         const pullHistories = await Promise.all(pulls.map(async (pull) => {
//             const pullPlayers = await PullPlayer.findAll({
//                 where: { pullId: pull.id },
//                 include: [{ model: User, as: 'User', attributes: ['userName'] }]
//             });
//             const totalPullAmount = pullPlayers.reduce((sum, player) => sum + player.amount, 0);
//             const totalWinAmount = pullPlayers.reduce((sum, player) => player.isWinner ? sum + player.winAmount : sum, 0);
//             const totalLossAmount = totalPullAmount - totalWinAmount;

//             const playersWithLosses = pullPlayers.map(player => ({
//                 ...player.toJSON(), 
//                 playerName: player.User ? player.User.userName : null,
//                 lossAmount: !player.isWinner ? totalLossAmount : 0, 
//                 winAmount: player.winAmount || 0 
//             }));
//             playersWithLosses.forEach(player => delete player.User);
//             return {
//                 pullId: pull.id,
//                 gameId: pull.gameId,
//                 crashPoint: pull.crashPoint,
//                 pullTime: pull.pullTime,
//                 playerCount: pullPlayers.length,
//                 totalPullAmount,
//                 totalWinAmount,
//                 totalLossAmount,
//                 players: playersWithLosses
//             };
//         }));

//         // Count the total number of pulls for pagination info
//         const totalPulls = await Pull.count({ where: whereConditions });

//         // Log successful retrieval of crash game history
//         await Logs.create({
//             userId: null,
//             action: `Crash game history retrieved successfully for gameId: ${gameId} - Page: ${pageNumber}, Limit: ${pageSize}, Total Pulls: ${totalPulls}`,
//             logTime: new Date(),
//         });

//         res.status(200).json({
//             message: "Data found",
//             totalPulls,
//             totalPages: Math.ceil(totalPulls / pageSize),
//             currentPage: pageNumber,
//             pulls: pullHistories
//         });
//     } catch (error) {
//         console.error(error);
//         await Logs.create({
//             userId: null,
//             action: `Error retrieving crash game history by gameId: ${error.message}`,
//             logTime: new Date(),
//             details: error.stack,
//         });
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

// export const getGameHistory = async (req, res) => {
//     try {
//         const { gameId } = req.params;
//         // Extract pagination and filtering parameters 
//         const { page = 1, limit = 10, pullId, crashPoint, crashPointOperator, totalAmount, totalAmountOperator, startDate, endDate, playerCount, playerCountOperator, sortBy = 'pullTime', sortOrder = 'DESC' } = req.query;

//         // Validate pagination parameters
//         const pageNumber = parseInt(page, 10);
//         const pageSize = parseInt(limit, 10);

//         if (!gameId) {
//             return res.status(400).json({ message: "gameId is required" });
//         }

//         if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
//             return res.status(400).json({ message: "Invalid pagination parameters" });
//         }

//         if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
//             return res.status(400).json({ message: "Invalid sort order" });
//         }

//         // Log the attempt to find crash game history with pagination and filters
//         await Logs.create({
//             userId: null, 
//             action: `Find crash game history by gameId attempt - Game ID: ${gameId}, Page: ${pageNumber}, Limit: ${pageSize}, Filters: ${JSON.stringify(req.query)}`,
//             logTime: new Date(),
//         });

//         // Calculate offset for pagination
//         const offset = (pageNumber - 1) * pageSize;

//         // Build the filter conditions
//         let whereConditions = { gameId };

//         if (pullId) whereConditions.id = pullId;

//         if (crashPoint) {
//             whereConditions.crashPoint = {};
//             switch (crashPointOperator) {
//                 case '>':
//                     whereConditions.crashPoint[Op.gt] = parseFloat(crashPoint);
//                     break;
//                 case '<':
//                     whereConditions.crashPoint[Op.lt] = parseFloat(crashPoint);
//                     break;
//                 case '=':
//                     whereConditions.crashPoint[Op.eq] = parseFloat(crashPoint);
//                     break;
//             }
//         }

//         if (startDate) whereConditions.pullTime = { [Op.gte]: new Date(startDate) };
//         if (endDate) whereConditions.pullTime = { [Op.lte]: new Date(endDate) };

//         // Build a subquery to filter pulls based on total amount (sum of player bets) from players
//         let havingConditions = {};
//         if (totalAmount) {
//             let operator = null;
//             switch (totalAmountOperator) {
//                 case '>':
//                     operator = Op.gt;
//                     break;
//                 case '<':
//                     operator = Op.lt;
//                     break;
//                 case '=':
//                     operator = Op.eq;
//                     break;
//                 default:
//                     return res.status(400).json({ message: 'Invalid totalAmountOperator' });
//             }
//             havingConditions['totalAmount'] = { [operator]: parseFloat(totalAmount) };
//         }

//         // Handle playerCount filtering using subquery aggregation
//         if (playerCount) {
//             havingConditions['playerCount'] = {};
//             switch (playerCountOperator) {
//                 case '>':
//                     havingConditions['playerCount'][Op.gt] = parseInt(playerCount, 10);
//                     break;
//                 case '<':
//                     havingConditions['playerCount'][Op.lt] = parseInt(playerCount, 10);
//                     break;
//                 case '=':
//                     havingConditions['playerCount'][Op.eq] = parseInt(playerCount, 10);
//                     break;
//             }
//         }

//         // Retrieve all pulls for the specified gameId with filters, pagination, and sorting
//         const pulls = await Pull.findAll({
//             where: whereConditions,
//             attributes: [
//                 'id', 'gameId', 'crashPoint', 'pullTime',
//                 // Use Sequelize to calculate the totalAmount and playerCount for each pull
//                 [Sequelize.fn('SUM', Sequelize.col('PullPlayers.amount')), 'totalAmount'],
//                 [Sequelize.fn('COUNT', Sequelize.col('PullPlayers.id')), 'playerCount'],
//             ],
//             include: [{
//                 model: PullPlayer,
//                 attributes: [], // No attributes needed from PullPlayer for this query
//                 required: true
//             }],
//             group: ['Pull.id'], // Group by Pull ID to aggregate the data
//             having: havingConditions, // Apply the having conditions for totalAmount and playerCount
//             limit: pageSize,
//             offset: offset,
//             order: [[sortBy, sortOrder]],
//             subQuery: false // Ensures proper grouping without the subquery limitation
//         });

//         // Aggregate data for each pull
//         const pullHistories = await Promise.all(pulls.map(async (pull) => {
//             const pullPlayers = await PullPlayer.findAll({
//                 where: { pullId: pull.id },
//                 include: [{ model: User, as: 'User', attributes: ['userName'] }]
//             });
//             const totalPullAmount = pullPlayers.reduce((sum, player) => sum + player.amount, 0);
//             const totalWinAmount = pullPlayers.reduce((sum, player) => player.isWinner ? sum + player.winAmount : sum, 0);
//             const totalLossAmount = totalPullAmount - totalWinAmount;

//             const playersWithLosses = pullPlayers.map(player => ({
//                 ...player.toJSON(), 
//                 playerName: player.User ? player.User.userName : null,
//                 lossAmount: !player.isWinner ? totalLossAmount : 0, 
//                 winAmount: player.winAmount || 0 
//             }));
//             playersWithLosses.forEach(player => delete player.User);
//             return {
//                 pullId: pull.id,
//                 gameId: pull.gameId,
//                 crashPoint: pull.crashPoint,
//                 pullTime: pull.pullTime,
//                 playerCount: pullPlayers.length,
//                 totalPullAmount,
//                 totalWinAmount,
//                 totalLossAmount,
//                 players: playersWithLosses
//             };
//         }));

//         // Count the total number of pulls for pagination info
//         const totalPulls = await Pull.count({ where: whereConditions });

//         // Log successful retrieval of crash game history
//         await Logs.create({
//             userId: null,
//             action: `Crash game history retrieved successfully for gameId: ${gameId} - Page: ${pageNumber}, Limit: ${pageSize}, Total Pulls: ${totalPulls}`,
//             logTime: new Date(),
//         });

//         res.status(200).json({
//             message: "Data found",
//             totalPulls,
//             totalPages: Math.ceil(totalPulls / pageSize),
//             currentPage: pageNumber,
//             pulls: pullHistories
//         });
//     } catch (error) {
//         console.error(error);
//         await Logs.create({
//             userId: null,
//             action: `Error retrieving crash game history by gameId: ${error.message}`,
//             logTime: new Date(),
//             details: error.stack,
//         });
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

const nonPullGameHistory = async (gameId, filters) => {
    const {
        page = 1, limit = 10,
        userName,
        betType,
        betAmountMin,
        betAmountMax,
        winAmountMin,
        winAmountMax,
        cashOutAtMin,
        cashOutAtMax,
        startDate,
        endDate,
        sortBy = 'betTime',
        sortOrder = 'DESC'
    } = filters
    try {
        // Validate pagination parameters
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const offset = (pageNumber - 1) * pageSize;

        if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
            return { success: false, message: "Invalid pagination parameters" }
        }

        if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
            return { success: false, message: "Invalid sort order" }
        }

        const where = {};

        where.gameId = gameId;

        if (betType) where.betType = betType;

        if (betAmountMin && betAmountMax) where.betAmount = { [Op.between]: [parseFloat(betAmountMin), parseFloat(betAmountMax)] };

        if (winAmountMin && winAmountMax) where.winAmount = { [Op.between]: [parseFloat(winAmountMin), parseFloat(winAmountMax)] };

        if (cashOutAtMin && cashOutAtMax) where.cashOutAt = { [Op.between]: [parseFloat(cashOutAtMin), parseFloat(cashOutAtMax)] };

        if (startDate && endDate) where.betTime = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };

        const effectiveSortBy = sortBy === 'betId' ? 'id' : sortBy;
        let data, totalPulls;

        if (userName) {
            data = await Bet.findAll({
                where,
                attributes: ['id', 'betType', 'gameId', 'betAmount', 'multiplier', 'cashOutAt', 'winAmount', 'betTime'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'userName'],
                        where: {
                            userName: {
                                [Op.like]: `${userName}%`
                            }
                        },
                        required: true
                    }
                ],
                limit: pageSize,
                offset: offset,
                order: [[effectiveSortBy, sortOrder]],
                subQuery: false
            })

            totalPulls = await Bet.count({
                where,
                attributes: ['id', 'betType', 'gameId', 'betAmount', 'multiplier', 'cashOutAt', 'winAmount', 'betTime'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'userName'],
                        where: {
                            userName: {
                                [Op.like]: `${userName}%`
                            }
                        },
                        required: true
                    }
                ],
                subQuery: false
            });
        } else {
            data = await Bet.findAll({
                where,
                attributes: ['id', 'betType', 'gameId', 'betAmount', 'multiplier', 'cashOutAt', 'winAmount', 'betTime'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'userName', 'email'],
                        required: true
                    }
                ],
                limit: pageSize,
                offset: offset,
                order: [[effectiveSortBy, sortOrder]],
                subQuery: false
            });
            totalPulls = await Bet.count({
                where,
                attributes: ['id', 'betType', 'gameId', 'betAmount', 'multiplier', 'cashOutAt', 'winAmount', 'betTime'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'userName'],
                        required: true
                    }
                ],
                subQuery: false
            });
        }

        const betData = data.map(item => {
            const bet = item.toJSON();
            // bet.lossAmount = bet.betAmount - bet.winAmount
            bet.lossAmount = 0;
            if (bet.winAmount == 0) {
                bet.lossAmount = bet.betAmount;
            }
            return bet;
        });
        
        

        const resource = {
            totalPulls,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalPulls / pageSize),
            pulls: betData,

        }
        if (betData.length) return { success: true, message: 'Data Found', resource };

        return { success: true, message: 'No Data Available', resource };
    } catch (error) {
        return { success: false, error };
    }
}

export const getGameHistory = async (req, res) => {
    const { gameId } = req.params;
    if (!gameId) {
        return res.status(400).json({ message: "gameId is required" });
    }

    try {
        const pullExists = await Pull.findOne({ where: { gameId } });

        if (!pullExists) {
            const data = await nonPullGameHistory(gameId, req.query);

            if (data.success) {
                return res.status(200).json({
                    message: data.message,
                    ...data.resource
                });
            }

            console.log("error ====>", data.error);
            return res.status(500).json({
                error: "Internal Server Error"
            })
        }

        // Extract pagination and filtering parameters 
        const {
            page = 1, limit = 10,
            pullId,
            pullIdMin,
            pullIdMax,
            pullIdOperator,
            crashPoint,
            crashPointMin,
            crashPointMax,
            crashPointOperator,
            totalAmount,
            totalAmountMin,
            totalAmountMax,
            totalAmountOperator,
            startDate,
            endDate,
            playerCount,
            playerCountMin,
            playerCountMax,
            playerCountOperator,
            sortBy = 'pullTime',
            sortOrder = 'DESC'
        } = req.query;

        // Validate pagination parameters
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);

        if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
            return res.status(400).json({ message: "Invalid pagination parameters" });
        }

        if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
            return res.status(400).json({ message: "Invalid sort order" });
        }

        // Log the attempt to find crash game history with pagination and filters
        await addLog(
            "admin",
            'admin',
            'FindGameHistoryAttempt',  // Action type
            `Find crash game history by gameId attempt - Game ID: ${gameId}, Page: ${pageNumber}, Limit: ${pageSize}`,  // Description
            'CrashGame'
        );

        // Calculate offset for pagination
        const offset = (pageNumber - 1) * pageSize;

        // Build the filter conditions
        let whereConditions = { gameId };

        // PullId filtering with range support
        // if (pullId) whereConditions.id = pullId;
        if (pullId) {
            whereConditions.id = {};
            switch (pullIdOperator) {
                case '>':
                    whereConditions.id[Op.gt] = parseInt(pullId, 10);
                    break;
                case '<':
                    whereConditions.id[Op.lt] = parseInt(pullId, 10);
                    break;
                case '=':
                    whereConditions.id[Op.eq] = parseInt(pullId, 10);
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid pullIdOperator' });
            }
        }
        if (pullIdMin && pullIdMax) whereConditions.id = { [Op.between]: [pullIdMin, pullIdMax] };

        // CrashPoint filtering with range and operator support
        /* if (crashPoint) {
            whereConditions.crashPoint = {};
            switch (crashPointOperator) {
                case '>':
                    whereConditions.crashPoint[Op.gt] = parseFloat(crashPoint);
                    break;
                case '<':
                    whereConditions.crashPoint[Op.lt] = parseFloat(crashPoint);
                    break;
                case '=':
                    whereConditions.crashPoint[Op.eq] = parseFloat(crashPoint);
                    break;
            }
        }
        if (crashPointMin && crashPointMax) {
            whereConditions.crashPoint = { [Op.between]: [parseFloat(crashPointMin), parseFloat(crashPointMax)] };
        } */
        if (crashPoint) {
            whereConditions.crashPoint = {};
            const roundedCrashPoint = parseFloat(crashPoint).toFixed(2);  // Round to 2 decimal places

            switch (crashPointOperator) {
                case '>':
                    whereConditions.crashPoint[Op.gt] = parseFloat(roundedCrashPoint);
                    break;
                case '<':
                    whereConditions.crashPoint[Op.lt] = parseFloat(roundedCrashPoint);
                    break;
                case '=':
                    whereConditions.crashPoint[Op.eq] = parseFloat(roundedCrashPoint);
                    break;
            }
        }

        // CrashPoint range filtering
        if (crashPointMin && crashPointMax) {
            whereConditions.crashPoint = {
                [Op.between]: [
                    parseFloat(crashPointMin).toFixed(2),
                    parseFloat(crashPointMax).toFixed(2)
                ]
            };
        }
        // Date filtering
        // Date filtering
        // if (startDate) whereConditions.pullTime = { [Op.gte]: new Date(startDate) };
        // if (endDate) {
        //     if (whereConditions.pullTime) {
        //         whereConditions.pullTime[Op.lte] = new Date(endDate);
        //     } else {
        //         whereConditions.pullTime = { [Op.lte]: new Date(endDate) };
        //     }
        // }
        if (startDate && endDate) whereConditions.pullTime = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };

        // Build the subquery to filter pulls based on total amount (sum of player bets) from players
        let havingConditions = {};
        if (totalAmount) {
            let operator = null;
            switch (totalAmountOperator) {
                case '>':
                    operator = Op.gt;
                    break;
                case '<':
                    operator = Op.lt;
                    break;
                case '=':
                    operator = Op.eq;
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid totalAmountOperator' });
            }
            havingConditions['totalAmount'] = { [operator]: parseFloat(totalAmount) };
        }
        if (totalAmountMin && totalAmountMax) {
            havingConditions['totalAmount'] = { [Op.between]: [parseFloat(totalAmountMin), parseFloat(totalAmountMax)] };
        }

        // PlayerCount filtering with range and operator support
        if (playerCount) {
            havingConditions['playerCount'] = {};
            switch (playerCountOperator) {
                case '>':
                    havingConditions['playerCount'][Op.gt] = parseInt(playerCount, 10);
                    break;
                case '<':
                    havingConditions['playerCount'][Op.lt] = parseInt(playerCount, 10);
                    break;
                case '=':
                    havingConditions['playerCount'][Op.eq] = parseInt(playerCount, 10);
                    break;
            }
        }
        if (playerCountMin && playerCountMax) {
            havingConditions['playerCount'] = { [Op.between]: [parseInt(playerCountMin, 10), parseInt(playerCountMax, 10)] };
        }
        const effectiveSortBy = sortBy === 'pullId' ? 'id' : sortBy;
        // Retrieve all pulls for the specified gameId with filters, pagination, and sorting
        const pulls = await Pull.findAll({
            where: whereConditions,
            attributes: [
                'id', 'gameId', 'crashPoint', 'pullTime',
                // Use Sequelize to calculate the totalAmount and playerCount for each pull
                [Sequelize.fn('SUM', Sequelize.col('PullPlayers.amount')), 'totalAmount'],
                [Sequelize.fn('COUNT', Sequelize.col('PullPlayers.id')), 'playerCount'],
            ],
            include: [{
                model: PullPlayer,
                attributes: [], // No attributes needed from PullPlayer for this query
                required: true
            }],
            group: ['Pull.id'], // Group by Pull ID to aggregate the data
            having: havingConditions, // Apply the having conditions for totalAmount and playerCount
            limit: pageSize,
            offset: offset,
            order: [[effectiveSortBy, sortOrder]],
            subQuery: false // Ensures proper grouping without the subquery limitation
        });

        // Aggregate data for each pull
        const pullHistories = await Promise.all(pulls.map(async (pull) => {
            const pullPlayers = await PullPlayer.findAll({
                where: { pullId: pull.id },
                include: [{ model: User, as: 'User', attributes: ['userName'] }]
            });
            const totalPullAmount = pullPlayers.reduce((sum, player) => sum + player.amount, 0);
            const totalWinAmount = pullPlayers.reduce((sum, player) => player.isWinner ? sum + player.winAmount : sum, 0);
            const totalLossAmount = totalPullAmount - totalWinAmount;

            const playersWithLosses = pullPlayers.map(player => ({
                ...player.toJSON(),
                playerName: player.User ? player.User.userName : null,
                lossAmount: !player.isWinner ? totalLossAmount : 0,
                winAmount: player.winAmount || 0
            }));
            playersWithLosses.forEach(player => delete player.User);
            return {
                pullId: pull.id,
                gameId: pull.gameId,
                crashPoint: pull.crashPoint,
                pullTime: pull.pullTime,
                playerCount: pullPlayers.length,
                totalPullAmount,
                totalWinAmount,
                totalLossAmount,
                players: playersWithLosses
            };
        }));

        // Count the total number of pulls for pagination info
        // const totalPulls = await Pull.count({ where: whereConditions });
        // Retrieve total pulls count with filters
        const totalPullsResult = await Pull.findAll({
            where: whereConditions,
            attributes: [
                'id',
                // Same attributes as in the main query to ensure consistency
                [Sequelize.fn('SUM', Sequelize.col('PullPlayers.amount')), 'totalAmount'],
                [Sequelize.fn('COUNT', Sequelize.col('PullPlayers.id')), 'playerCount'],
            ],
            include: [{
                model: PullPlayer,
                attributes: [],
                required: true
            }],
            group: ['Pull.id'],
            having: havingConditions,
            subQuery: false // Avoid subquery for proper grouping
        });

        // Count the total number of pulls after filtering and grouping
        const totalPulls = totalPullsResult.length; // Length of the filtered result
        // Log successful retrieval of crash game history
        await addLog(
            "admin",
            'admin',
            'RetrieveGameHistorySuccess',
            `Crash game history retrieved successfully for gameId: ${gameId} - Page: ${pageNumber}, Total Pulls: ${totalPulls}`,
            'CrashGame'
        );

        res.status(200).json({
            message: "Data found",
            totalPulls,
            totalPages: Math.ceil(totalPulls / pageSize),
            currentPage: pageNumber,
            pulls: pullHistories
        });
    } catch (error) {
        console.error(error);
        await addLog(
            "admin",
            'admin',
            'RetrieveGameHistoryError',
            `Error retrieving crash game history for gameId: ${gameId}`,
            'CrashGame'
        );
        return res.status(500).json({ error: 'Internal server error' });
    }
};

