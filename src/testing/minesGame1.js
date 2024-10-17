    import Bet from '../models/Bet.js';

    const gameSessions = new Map(); // To track each session's game data

    const getRandomMines = (rows, cols, mines) => {
        const locations = [];
        while (locations.length < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            const location = `${row}-${col}`;
            if (!locations.includes(location)) {
                locations.push(location);
            }
        }
        
        return locations;
    };

    const checkForMines = (mines, cell) => mines.includes(cell);

    export const minesSocketHandler = (io) => {
        io.on('connection', (socket) => {
            console.log('New player connected for minesGame');

            // When a game starts
            socket.on('startGame', (data) => {
                const { gameId, rows, cols, mines } = data;
                const minesLocations = getRandomMines(rows, cols, mines);
                gameSessions.set(gameId, {
                    minesLocations,
                    started: true,
                    multiplier: 1.01, // Start multiplier
                    clickedCells: [],
                    winAmount: 0
                });
                console.log(`Game started. Game ID: ${gameId}, Mines Locations: ${minesLocations}`);
            });

            // When a player places a bet
            socket.on('minesplaceBet', async (data) => {
                const { userId, gameId, betAmount, selectedCell } = data;
                const session = gameSessions.get(gameId);
                
                if (!session || !session.started) {
                    return socket.emit('error', { message: 'Game not started or invalid game ID' });
                }

                const { minesLocations, clickedCells } = session;
                
                if (clickedCells.includes(selectedCell)) {
                    return socket.emit('error', { message: 'Cell already selected' });
                }
                
                clickedCells.push(selectedCell);
                const hitMine = checkForMines(minesLocations, selectedCell);

                if (hitMine) {
                    session.started = false; // End the game if a mine is hit
                    session.multiplier = 0;  // No winnings
                } else {
                    // Double the multiplier if no mine was hit
                    session.multiplier *= 2;
                    session.winAmount = betAmount * session.multiplier;
                }

                try {
                    // Save the bet result to the database
                    await Bet.create({
                        gameId,
                        userId,
                        betAmount,
                        winAmount: session.winAmount
                    });

                    // Emit the result to the player
                    socket.emit('minesbetResult', {
                        hitMine,
                        minesLocations,
                        clickedCells,
                        multiplier: session.multiplier,
                        winAmount: session.winAmount
                    });

                    // If mine was hit, the game ends
                    if (hitMine) {
                        session.started = false;
                    }
                } catch (error) {
                    console.error('Error processing bet:', error);
                    socket.emit('error', { message: 'Failed to process bet' });
                }
            });

            // Handle exiting the game
            socket.on('exitGame', (data) => {
                const { gameId } = data;
                const session = gameSessions.get(gameId);
                
                if (session && session.started) {
                    console.log('User exited the game');
                    socket.emit('minesbetResult', {
                        hitMine: false,
                        minesLocations: session.minesLocations,
                        clickedCells: session.clickedCells,
                        multiplier: session.multiplier,
                        winAmount: session.winAmount
                    });
                    session.started = false; // End the game on exit
                }
            });

            // Handle player disconnection
            socket.on('disconnect', () => {
                console.log('Player disconnected');
            });
        });
    };
