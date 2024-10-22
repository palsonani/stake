import Wallet from "../models/Wallet.js";

export const wheelSocketHandler = (io) => {
    let players = {};
    let bets = [];
    let currentRound = null;

    io.on('connection', (socket) => {
        console.log(`Player connected for wheel Game`);

        let isAutoBetPaused = false;
        let autoBetInterval = null;

        // Handle manual bet
        socket.on('manualBet', async (betData) => {
            const { betAmount, risk, segment, userId } = betData;
            console.log(betData);   

            const wallet = await Wallet.findOne({ where: { userId } });
            if (!wallet) {
                io.to(userId).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                return;
            }
            if (wallet.currentAmount <= betAmount) {
                console.log('inif', wallet.currentAmount, betAmount);
                io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                return;
            }

            const multiplier = getMultiplier(segment, risk);
            const result = spinWheel(segment, risk); // Spin the wheel and pick a result

            const outcome = calculateOutcome(betAmount, result, multiplier);
            console.log("Outcome:", outcome);

            // Broadcast the result
            io.to(socket.id).emit('manualBetResult', outcome);
        });

        // Handle auto bet logic
        socket.on('autoBet', async (autoBetData) => {
            let { betAmount, risk, segment, numberOfBets, onWin, onLoss, stopOnLoss, stopOnProfit, userId } = autoBetData;
            console.log("autoBetData", autoBetData)

            const wallet = await Wallet.findOne({ where: { userId } });
            if (!wallet) {
                io.to(user.id).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                return;
            }
            if (wallet.currentAmount <= betAmount) {
                console.log('inif', wallet.currentAmount, betAmount);
                io.to(user.id).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                return;
            }

            let remainingBets = numberOfBets;
            let totalProfit = 0;
            let totalLoss = 0;

            const runAutoBet = () => {
                if (remainingBets > 0 && !isAutoBetPaused) {

                    const multiplier = getMultiplier(segment, risk);
                    const result = spinWheel(segment, risk);

                    const outcome = calculateOutcome(betAmount, result, multiplier);
                    console.log("betAmount, remainingBets, outcome", betAmount, remainingBets, outcome)
                    if (outcome.success) {
                        totalProfit += (outcome.payout - betAmount);
                        betAmount += onWin;
                    } else {
                        totalLoss += betAmount;
                        betAmount -= onLoss;
                    }
                    if (stopOnLoss || stopOnProfit) {
                        if (totalLoss >= stopOnLoss || totalProfit >= stopOnProfit) {
                            io.to(socket.id).emit('autoBetStop', { totalProfit, totalLoss });
                            clearInterval(autoBetInterval); // Stop auto-bet interval
                            return;
                        }
                    }

                    remainingBets--;
                    io.to(socket.id).emit('autoBetResult', { betAmount, remainingBets, outcome });

                }
            };

            // Start the auto-bet interval, running every 1 second
            autoBetInterval = setInterval(runAutoBet, 1000);

            socket.on('pauseAutoBet', () => {
                console.log('Auto-bet paused.');
                isAutoBetPaused = true; // Set flag to true to pause auto bet
            });

            socket.on('resumeAutoBet', () => {
                console.log('Auto-bet resumed.');
                isAutoBetPaused = false; // Set flag to false to resume auto bet
                runAutoBet(); // Immediately run one round of auto-bet on resume
            });

            socket.on('disconnect', () => {
                console.log(`Player disconnected: ${socket.id}`);
                clearInterval(autoBetInterval); // Clear the interval when the player disconnects
            });
        });
    });

    // Helper functions
    function getMultiplier(segment, risk) {
        console.log(segment, risk);

        return rowConfigs[segment][risk];
    }

    function spinWheel(segment, risk) {
        // Simulate spinning the wheel and return a random integer index
        const maxIndex = rowConfigs[segment][risk].length;
        const result = Math.floor(Math.random() * maxIndex); // Return integer result
        return result;
    }

    function calculateOutcome(betAmount, result, multiplier) {
        const success = result > 0; // Success if result isn't 0
        const payout = success ? betAmount * multiplier[result] : 0;
        console.log("Payout calculation:", result, multiplier[result], payout);
        return { position: result, multiplier: multiplier[result] };
    }

    const rowConfigs = {
        10: {
            low: [0.00, 1.20, 1.50],
            medium: [0.00, 1.50, 1.90, 2.00, 3.00],
            high: [0.00, 9.90]
        },
        20: {
            low: [0.00, 1.20, 1.50],
            medium: [0.00, 1.50, 1.80, 2.00, 3.00],
            high: [0.00, 19.80]
        },
        30: {
            low: [0.00, 1.20, 1.50],
            medium: [0.00, 1.50, 2.00, 3.00, 5.00],
            high: [0.00, 29.70]
        },
        40: {
            low: [0.00, 1.20, 1.50],
            medium: [0.00, 1.50, 1.60, 2.00, 3.00],
            high: [0.00, 39.60]
        },
        50: {
            low: [0.00, 1.20, 1.50],
            medium: [0.00, 1.50, 2.00, 3.00, 5.00],
            high: [0.00, 49.50]
        }
    };
};
