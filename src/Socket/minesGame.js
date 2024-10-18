import Bet from '../models/Bet.js';
import FinancialTransaction from '../models/financialTransaction.js';
import MineLocation from '../models/MineLocation.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';

export const minesSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New user connected for mines game'); // Log when a user connects
        io.emit('minesConnection', { message: 'new minesConnection' });
        let roomName;

        socket.on('joinGame', async (data) => {
            const roomName = `game_${data.gameId}`;
            socket.join(roomName);
            console.log('User joined room:', roomName);
            console.log('Updated rooms:', io.sockets.adapter.rooms);
            if (!data.gameId && !data.userId) {
                throw new Error('Enter userId and gameId');
            }
            const activeBet = await Bet.findOne({
                where: {
                    userId: data.userId,
                    gameId: data.gameId,
                    isActive: true // Check for an active bet
                }
            });

            if (activeBet) {
                betId = activeBet.id; // Store the active bet ID
                console.log('Active bet found for user:', data.userId, betId);

                // Restore game state
                const gameState = await restoreGameState(data.gameId, data.userId, betId);
                step = gameState.totalSelectedTiles
                const currentMultiplier = calculateIncrement(gameState.mines, step - 1);
                socket.emit('gameRestored', gameState, currentMultiplier);
                console.log('Game restored for user:', data.userId, gameState, currentMultiplier);
                console.log('currentMultipliercurrentMultiplier::', currentMultiplier)
                return;
            }

        });

        let betId;
        let bakendMultiplayer;
        let step = 0;

        // socket.on('checkActiveBet', async (data) => {
        //     const { userId, gameId } = data;

        //     // Check if there is an active bet for the user and game
        //     const activeBet = await Bet.findOne({
        //         where: {
        //             userId,
        //             gameId,
        //             isActive: true // Ensure the bet is active
        //         }
        //     });

        //     if (activeBet) {
        //         betId = activeBet.id; // Store the active bet ID
        //         console.log('Active bet found for user:', userId, betId);

        //         // Restore game state
        //         const gameState = await restoreGameState(gameId, userId, betId);
        //         socket.emit('gameRestored', gameState);
        //         console.log('Game restored for user:', userId, gameState);
        //     } else {
        //         console.log('No active bet found for user:', userId);
        //     }
        // });

        socket.on('minePlaceBet', async (data) => {
            console.log('Start game request received:', data);
            step = 0;
            const { userId, gameId, totalMines, betAmount } = data;
            
            bakendMultiplayer = await getBackendMultiplier(userId, gameId, totalMines)
            // Create a new bet record
            const bet = await Bet.create({ gameId, userId, mines: totalMines, multiplier: bakendMultiplayer, betType: 'manual',betAmount });
            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    return { success: false, error: 'Wallet not found' };
                }
                if (wallet.currentAmount < betAmount) {
                    io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                    return;
                }
                await Wallet.update(
                    { currentAmount: wallet.currentAmount - betAmount },
                    { where: { userId } }
                );

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: betAmount,
                    transactionType: 'bet',
                    transactionDirection: 'debit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                await FinancialTransaction.create({
                    gameId: gameId,
                    walletId: wallet.id,
                    userId,
                    amount: betAmount,
                    transactionType: 'bet',
                    transactionDirection: 'credit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });
            } catch (error) {
                console.log('error in transaction', error);
            }

            betId = bet.id;
            try {
                // Initialize game board with 25 tiles (0 to 24)
                for (let tileIndex = 0; tileIndex < 25; tileIndex++) {
                    await MineLocation.create({
                        gameId,
                        userId,
                        tileIndex,
                        isMine: false,
                        betId: bet.id // Associate with the new bet
                    });
                    console.log(`Tile created: ${tileIndex}, isMine: false`);
                }
            }
            catch {
                console.log('Game started and emitted:', { gameId, betId: bet.id });
            }
            socket.emit('gameStarted', { gameId, betId: bet.id });
            console.log('Game started and emitted:', { gameId, betId: bet.id });
        })

        socket.on('selectTile', async (data) => {
            console.log('Tile selection request received:', data);
            const { gameId, userId, tileIndex } = data;

            try {
                console.log("select tiles bet::", betId);

                const result = await selectTile(gameId, userId, tileIndex, betId, step, bakendMultiplayer);
                console.log("lkjsdbgfjhsd", result);

                step++;
                if (result.gameOver) {
                    console.log('Game over for user:', userId);

                    // Send remaining mine locations to the frontend
                    const remainingMines = await getRemainingMines(gameId, userId, betId);
                    socket.emit('gameOver', {
                        multiplier: result.multiplier,
                        remainingMines,
                        clickedMine: result.clickedMine
                    });
                } else {
                    console.log('Tile selected:', { tileIndex, multiplier: result.multiplier });
                    socket.emit('tileSelected', { tileIndex, multiplier: result.multiplier });
                }
            } catch (error) {
                console.error('Error selecting tile:', error.message);
                console.log(error)
                socket.emit('error', { message: error.message });
            }
        });

        // socket.on('restoreGame', async (data) => {
        //     console.log('Restore game request received:', data);
        //     const { gameId, userId } = data;

        //     // Restore game state
        //     const gameState = await restoreGameState(gameId, userId, betId);
        //     socket.emit('gameRestored', gameState);
        //     console.log('Game restored for user:', userId, gameState);
        // });

        socket.on('cashout', async (data) => {
            const { gameId, userId } = data;

            try {
                // Retrieve the current game state and multiplier
                const gameState = await restoreGameState(data.gameId, data.userId, betId);
                step = gameState.totalSelectedTiles
                const currentMultiplier = calculateIncrement(gameState.mines, step - 1);

                // Finalize the bet by marking it as a win (or save the final multiplier)
                const bet = await Bet.findOne({ where: { id: betId, gameId, userId } });
                const winAmount = bet.betAmount * currentMultiplier;
                if (bet) {
                    bet.cashOutAt = currentMultiplier; // Save the final multiplier
                    bet.isActive = false;
                    bet.winAmount = winAmount
                    await bet.save();
                }

                console.log('User cashed out successfully:', { userId, currentMultiplier });
                socket.emit('cashoutSuccess', { multiplier: currentMultiplier,totalSelectedTiles:gameState.totalSelectedTiles });

                const wallet = await Wallet.findOne({ where: { userId } });

                await Wallet.update(
                    { currentAmount: wallet.currentAmount + winAmount },
                    { where: { userId } }
                );

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: winAmount,
                    transactionType: 'win',
                    transactionDirection: 'credit',
                    description: `Won amount ${winAmount}`,
                    transactionTime: new Date(),
                });

                await FinancialTransaction.create({
                    gameId: gameId,
                    walletId: wallet.id,
                    userId,
                    amount: winAmount,
                    transactionType: 'win',
                    transactionDirection: 'debit',
                    description: `Won amount ${winAmount}`,
                    transactionTime: new Date(),
                });


            } catch (error) {
                console.error('Error during cashout:', error.message);
                socket.emit('error', { message: 'Cashout failed. Please try again.' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the mineGame server');
            if (roomName) {
                socket.leave(roomName);
            }
        });

    });

    async function selectTile(gameId, userId, tileIndex, betId, step, bakendMultiplayer) {
        // console.log('New bet created::::::::::::::::::::::::::::::::::::::', betId);
        // console.log('Selecting tile:', { gameId, userId, tileIndex, betId });

        const bet = await Bet.findOne({
            where: {
                id: betId,
                userId,
                gameId,
            }
        });
        //  console.log("bet:::", bet);

        // Check if the bet exists
        if (!bet) {
            console.error('Bet not found for user:', userId);
            throw new Error('Bet not found');
        }

        const selectedTiles = await MineLocation.count({
            where: { gameId, userId, selected: true, isMine: false, betId: bet.id } // Added betId check
        });

        // const currentMultiplier = 1.00 + selectedTiles * 0.25; // Example multiplier calculation
        // console.log('Current multiplier:', currentMultiplier);

        // Calculate base increment based on the total number of mines
        // console.log("bet.mines, step", bet.mines, step)
        const baseIncrement = calculateIncrement(bet.mines, step);
        // console.log("bet.mines, step", bet.mines, step, baseIncrement)
        // Calculate the current multiplier
        const currentMultiplier = baseIncrement;
        console.log('Current multiplier:', currentMultiplier);
        let finalbakendMultiplayer
        if (bet.multiplier) {
            finalbakendMultiplayer = bet.multiplier
        }
        else {
            finalbakendMultiplayer = bakendMultiplayer
        }
        console.log("bakendMultiplayerbakendMultiplayer::", finalbakendMultiplayer);

        // Check if the current multiplier has reached the threshold to set the next mine
        if (finalbakendMultiplayer <= currentMultiplier) {
            console.log('Setting next tile as mine for user:', userId);
            // Set the next tile as a mine
            await setNextTileAsMine(gameId, userId, tileIndex, bet.id); // Pass betId
        }

        const tile = await MineLocation.findOne({ where: { gameId, userId, tileIndex, betId: bet.id } }); // Added betId check
        console.log("Bet ID:", bet.id);

        // Check if the tile was found
        if (!tile) {
            console.error('Tile not found for index:', tileIndex);
            throw new Error('Tile not found');
        }

        if (tile.isMine) {
            // Game over: User clicked on a mine
            console.log('User clicked on a mine:', userId);

            // Mark bet as inactive (game over)
            bet.isActive = false;
            await bet.save();

            return { gameOver: true, multiplier: 0, clickedMine: tileIndex };
        } else {
            // Continue game, increase multiplier
            tile.selected = true;
            await tile.save();
            console.log('Tile selected successfully:', tileIndex);
            return { gameOver: false, multiplier: currentMultiplier };
        }
    }

    async function getBackendMultiplier(userId, gameId, totalMines) {
        const last10Bets = await Bet.findAll({
            where: { userId, gameId },
            order: [['betTime', 'DESC']],
            limit: 10
        });

        if (!last10Bets.length) return 1.01; // Default multiplier if no previous bets

        // Calculate total profit or loss
        let totalBetAmount = 0;
        let totalWinAmount = 0;

        last10Bets.forEach(bet => {
            totalBetAmount += bet.amount;
            totalWinAmount += bet.winAmount || 0; // Handle bets with no winAmount gracefully
        });

        const isInProfit = totalWinAmount >= totalBetAmount; // Determine if the user is in profit

        // Fetch the increment array for the given number of mines
        const increments = await calculateIncrement(totalMines);
        console.log("kjhaksbngdf:::", increments);

        if (!increments || increments.length === 0) return 1.01; // Fallback if array is not found

        // Select the appropriate half of the increments array based on profit/loss
        const midIndex = Math.floor(increments.length / 2);
        const relevantIncrements = isInProfit
            ? increments.slice(0, midIndex) // Lower half
            : increments.slice(midIndex);  // Upper half

        // Pick a random multiplier from the relevant increments
        const selectedMultiplier = relevantIncrements[Math.floor(Math.random() * relevantIncrements.length)];
        console.log("selectedMultiplierselectedMultiplier", selectedMultiplier);

        return selectedMultiplier.toFixed(2); // Return with 2 decimal precision
    }

    function calculateIncrement(totalMines, step) {
        const increments = {
            1: [0.03, 0.08, 0.12, 0.18, 0.24, 0.30, 0.37, 0.46, 0.55, 0.65, 0.77, 0.90, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.12, 4.95, 6.19, 8.25, 12.38, 24.75],
            2: [0.08, 0.17, 0.29, 0.41, 0.56, 0.74, 0.94, 2.18, 2.47, 2.83, 3.26, 3.81, 4.5, 5.4, 6.6, 8.25, 10.61, 14.14, 19.8, 29.7, 49.5, 99, 297],
            3: [0.13, 0.29, 0.48, 0.71, 2.0, 2.35, 2.79, 3.35, 4.07, 5.0, 6.26, 7.96, 10.35, 13.8, 18.97, 27.11, 40.66, 65.06, 113.85, 227.7, 569.25, 2277],
            4: [1.18, 1.41, 1.71, 20.9, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.3, 37.95, 59.64, 99.39, 178.91, 357.81, 834.9, 2504.7, 12523.5],
            5: [1.24, 1.56, 2.0, 2.58, 3.39, 4.52, 6.14, 8.5, 12.04, 17.52, 26.27, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504.7, 8766.45, 52598.7],
            6: [1.30, 1.74, 2.35, 3.23, 4.52, 4.46, 9.44, 14.17, 21.89, 35.03, 58.38, 102.17, 189.75, 379.5, 834.9, 2087.25, 6261.75, 25047, 175329],
            7: [1.37, 1.94, 2.79, 4.09, 6.14, 9.44, 14.95, 24.47, 41.6, 73.95, 138.66, 277.33, 600.87, 1442.1, 3965.77, 13219.25, 59486.62, 475893],
            8: [1.46, 2.18, 3.35, 5.26, 8.5, 14.17, 24.47, 44.05, 83.2, 166.4, 356.56, 831.98, 2163.15, 6489.45, 23794.65, 118973.25, 1070759.25],
            9: [1.55, 2.47, 4.07, 6.88, 12.04, 21.89, 41.6, 83.2, 176.8, 404.1, 1010.26, 2828.73, 9193.39, 36773.55, 202254.52, 2022545.25],
            10: [1.65, 2.83, 5.0, 9.17, 17.52, 35.03, 73.95, 166.4, 404.1, 1077.61, 3232.84, 11314.94, 49031.4, 294188.4, 3236072.4],
            11: [1.77, 3.26, 6.26, 12.51, 26.27, 58.38, 138.66, 356.56, 1010.26, 3232.84, 12123.15, 56574.69, 367735.5, 4412826],
            12: [1.90, 3.81, 7.96, 17.52, 40.87, 102.17, 277.33, 831.98, 2828.73, 11314.94, 56574.69, 396022.85, 5148297],
            13: [2.06, 4.5, 10.35, 25.3, 66.41, 189.75, 600.87, 2163.15, 9193.39, 49031.4, 367735.5, 5148297],
            14: [2.25, 5.4, 13.8, 37.95, 113.85, 379.5, 1442.1, 6489.45, 36773.55, 294188.4, 4412826],
            15: [2.47, 6.6, 18.97, 59.64, 208.72, 834.9, 3965.77, 23794.65, 202254.52, 3236072.4],
            16: [2.75, 8.25, 27.11, 99.39, 417.45, 2087.5, 13219.25, 118973.25, 2022545.25],
            17: [3.09, 10.61, 40.66, 178.91, 939.26, 6261.75, 59486.62, 1070759.25],
            18: [3.54, 14.14, 65.06, 357.81, 2504.7, 25047, 475893],
            19: [4.12, 19.18, 113.85, 834.9, 8766.45, 175329],
            20: [4.95, 29.7, 227.7, 2504.7, 52598.7],
            21: [6.19, 49.5, 569.25, 12523.5],
            22: [8.25, 99, 2277],
            23: [12.38, 297],
            24: [24.75]
        };

        if (increments[totalMines] && increments[totalMines][step]) {
            return increments[totalMines][step];
        }
        else if (increments[totalMines]) {
            return increments[totalMines];
        }
        else {
            return 0.05; // Default fallback if totalMines or step is out of bounds
        }
    }

    // Get remaining mine locations after a mine is revealed
    async function getRemainingMines(gameId, userId, betId) {
        console.log('Getting remaining mines for:', { gameId, userId });

        // Get all mine locations for the game that are mines and not yet selected
        const remainingMines = await MineLocation.findAll({
            where: {
                gameId,
                userId,
                isMine: true,
                selected: false,
                betId,
            }
        });

        return remainingMines.map(tile => tile.tileIndex); // Return the tile indices of remaining mines
    }

    // Set the next selected tile as a mine and randomly place the remaining mines
    // async function setNextTileAsMine(gameId, userId, tileIndex, betId) {
    //     console.log('Setting next tile as mine:', { gameId, userId, tileIndex });
    //     const nextTile = await MineLocation.findOne({
    //         where: { gameId, userId, tileIndex, betId } // Added betId check
    //     });

    //     // Set current selected tile as a mine
    //     if (nextTile) {
    //         nextTile.isMine = true;
    //         await nextTile.save();
    //         console.log('Tile set as mine:', tileIndex);
    //     }

    //     // Randomly place remaining mines in unselected tiles
    //     const remainingMines = await getUnselectedTiles(gameId, userId, betId); // Pass betId
    //     for (let i = 0; i < remainingMines.length; i++) {
    //         remainingMines[i].isMine = true;
    //         await remainingMines[i].save();
    //         console.log('Remaining mine placed:', remainingMines[i].tileIndex);
    //     }
    // }
    // Set the next selected tile as a mine and randomly place the remaining mines
    async function setNextTileAsMine(gameId, userId, tileIndex, betId) {
        console.log('Setting next tile as mine:', { gameId, userId, tileIndex });
        const nextTile = await MineLocation.findOne({
            where: { gameId, userId, tileIndex, betId } // Added betId check
        });

        // Set the current selected tile as a mine
        if (nextTile) {
            nextTile.isMine = true;
            await nextTile.save();
            console.log('Tile set as mine:', tileIndex);
        }

        // Randomly place remaining mines in unselected tiles
        const remainingMines = await getUnselectedTiles(gameId, userId, betId); // Pass betId

        // Shuffle the unselected tiles to randomize the mine placement
        const shuffledTiles = shuffleArray(remainingMines);
        const bet = await Bet.findOne({ where: { gameId, userId, id: betId } });
        if (!bet) {
            throw new Error('Bet not found');
        }
        for (let i = 0; i < bet.mines - 1; i++) {
            shuffledTiles[i].isMine = true;
            await shuffledTiles[i].save();
            console.log('Remaining mine placed:', shuffledTiles[i].tileIndex);
        }
    }

    // Helper function to shuffle an array randomly (Fisher-Yates shuffle algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Get a random index
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // Get unselected tiles where no mine is placed
    async function getUnselectedTiles(gameId, userId, betId) {
        console.log('Getting unselected tiles for:', { gameId, userId });

        const bet = await Bet.findOne({ where: { gameId, userId, id: betId } });
        if (!bet) {
            throw new Error('Bet not found');
        }

        // Ensure limit is not negative
        // const limit = Math.max(0, bet.mines - 1); // Ensures limit is at least 0

        return await MineLocation.findAll({
            where: {
                gameId,
                userId,
                isMine: false,
                selected: false,
                betId,
            },
            // limit, // Limit the number of unselected tiles to mine
        });
    }

    // Restore game state for the user
    async function restoreGameState(gameId, userId, betId) {
        console.log('Restoring game state for:', { gameId, userId, betId });

        // Fetch bet details
        const bet = await Bet.findOne({ where: { id: betId, userId } });
        if (!bet) {
            console.error('Bet not found for user:', userId);
            throw new Error('No active bet found');
        }

        // Fetch mine locations associated with the bet
        const mineLocations = await MineLocation.findAll({ where: { gameId, userId, betId } });
        const totalSelectedTiles = mineLocations.filter(tile => tile.selected).length;
        return {
            betId: bet.id,
            mines: bet.mines,
            betAmount:bet.betAmount,
            mineLocations: mineLocations.map(tile => ({
                tileIndex: tile.tileIndex,
                isMine: tile.isMine,
                selected: tile.selected
            })),
            totalSelectedTiles
        };
    }

};
