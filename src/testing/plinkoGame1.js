import { sequelize } from "../config/connection.js";
import Bet from "../models/Bet.js";

export const plinkoSocketHandler1 = (io) => {

    // Row configurations based on risk levels (low, medium, high)
    const rowConfigs = {
        8: {
            low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
            medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
            high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
        },
        9: {
            low: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
            medium: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
            high: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
        },
        10: {
            low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
            medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
            high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
        },
        11: {
            low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
            medium: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
            high: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120]
        },
        12: {
            low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
            medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
            high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
        },
        13: {
            low: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
            medium: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
            high: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
        },
        14: {
            low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
            medium: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
            high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
        },
        15: {
            low: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
            medium: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
            high: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
        },
        16: {
            low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
            medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
            high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
        }
    };

    // Function to simulate the ball drop
    // function dropBall(rows, riskLevel) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     const dropPosition = Math.floor(Math.random() * possibleOutcomes.length);
    //     const multiplier = possibleOutcomes[dropPosition];
    //     return { dropPosition, multiplier };
    // }

    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];

    //     // Calculate total winnings and losses for the user
    //     const totalBets = await Bet.findAll({
    //         where: { userId },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });

    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     const netGain = totalWin - totalBet;
    //     console.log("nextGain", netGain)
    //     // Adjust the drop probability based on the user's net gain
    //     let weightedProbabilities;

    //     if (netGain > 0) {
    //         // If the user is winning (net gain positive), give more chances for lower multipliers
    //         weightedProbabilities = [
    //             ...Array(50).fill(possibleOutcomes[0]),  // More lower multipliers
    //             ...Array(30).fill(possibleOutcomes[1]),
    //             ...Array(10).fill(possibleOutcomes[2]),
    //             ...Array(5).fill(possibleOutcomes[3]),
    //             ...Array(3).fill(possibleOutcomes[4])
    //         ];
    //     } else {
    //         // If the user is losing (net gain negative), give more chances for higher multipliers
    //         weightedProbabilities = [
    //             ...Array(5).fill(possibleOutcomes[0]),   // Fewer lower multipliers
    //             ...Array(10).fill(possibleOutcomes[1]),
    //             ...Array(30).fill(possibleOutcomes[2]),
    //             ...Array(50).fill(possibleOutcomes[3]),
    //             ...Array(80).fill(possibleOutcomes[4])   // More higher multipliers
    //         ];
    //     }
    //     console.log("weightedProbabilities::", weightedProbabilities);

    //     // Choose a random drop based on the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition::", dropPosition);

    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier::", multiplier);

    //     return { dropPosition, multiplier };
    // }
    // Function to generate weights dynamically based on the length of the possible outcomes
        // const generateWeights = (length, inProfit, totalBet, netGain) => {
        //     const mid = Math.floor(length / 2); // Find the middle index
        //     const weights = [];
            
        //     // Default weights
        //     const weightMiddle = inProfit ? 95 : 50; // High weight for middle position if in profit
        //     const weightAdjacent = inProfit ? 40 : 30; // Lower weight for adjacent positions if in profit
        //     const weightOthers = 5;  // Minimal weight for all other positions
    
        //     // Adjust weights based on net gain and total bet amount
        //     if (netGain > totalBet) {
        //         // Increase the weight for the middle and adjacent positions
        //         for (let i = 0; i < length; i++) {
        //             if (i === mid) {
        //                 weights.push(weightMiddle); // Heavily favor the middle position
        //             } else if (i === mid - 1 || i === mid + 1) {
        //                 weights.push(weightAdjacent); // Favor the adjacent positions
        //             } else {
        //                 weights.push(weightOthers); // Minimal weight for other positions
        //             }
        //         }
        //     } else {
        //         // Regular weight assignment
        //         for (let i = 0; i < length; i++) {
        //             if (i === mid) {
        //                 weights.push(weightMiddle); // Heavily favor the middle position
        //             } else if (i === mid - 1 || i === mid + 1) {
        //                 weights.push(weightAdjacent); // Favor the adjacent positions
        //             } else {
        //                 weights.push(weightOthers); // Normal weight for other positions
        //             }
        //         }
        //     }
            
        //     return weights;
        // };
    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     console.log('possibleOutcomes:', possibleOutcomes);
    
    //     // Fetch the user's betting history
    //     const totalBets = await Bet.findAll({
    //         where: { userId, gameId: 9 },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });
    
    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     const netGain = totalWin - totalBet;
    //     console.log("netGain:", netGain);
    
    //     // Determine if the user is in profit or loss
    //     const inProfit = netGain > 0;
    
    //     // Function to generate weights dynamically based on the length of the possible outcomes
    //     const generateWeights = (length, inProfit) => {
    //         const mid = Math.floor(length / 2); // Find the middle index
    //         const weights = [];
            
    //         // Adjust weights based on profit or loss
    //         const weightMiddle = inProfit ? 90 : 50; // Higher weight if in profit
    //         const weightAdjacent = inProfit ? 60 : 30; // Slightly lower weight for adjacent positions if in profit
    //         const weightOthers = inProfit ? 10 : 10;  // Lower weight for all other positions
            
    //         for (let i = 0; i < length; i++) {
    //             if (i === mid) {
    //                 weights.push(weightMiddle); // Heavily favor the middle position
    //             } else if (i === mid - 1 || i === mid + 1) {
    //                 weights.push(weightAdjacent); // Favor the adjacent positions
    //             } else {
    //                 weights.push(weightOthers); // Normal weight for other positions
    //             }
    //         }
            
    //         return weights;
    //     };
    
    //     // Generate weights based on the length of possible outcomes
    //     const baseWeights = generateWeights(possibleOutcomes.length, inProfit);
    
    //     // Create weighted probabilities based on the weights generated
    //     const weightedProbabilities = [];
    
    //     possibleOutcomes.forEach((multiplier, index) => {
    //         const weight = baseWeights[index];
    //         weightedProbabilities.push(...Array(weight).fill(multiplier));
    //     });
    
    //     console.log("weightedProbabilities:", weightedProbabilities);
    
    //     // Randomly select a drop position from the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition:", dropPosition);
    
    //     // Get the multiplier based on the drop position
    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier:", multiplier);
    
    //     return { dropPosition, multiplier };
    // }
    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     console.log('possibleOutcomes:', possibleOutcomes);

    //     // Fetch the user's betting history
    //     const totalBets = await Bet.findAll({
    //         where: { userId,gameId:9 },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });

    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     console.log("totalBet::",totalBet);

    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     console.log("totalWin::",totalWin);

    //     const netGain = totalWin - totalBet;
    //     console.log("netGain:", netGain);

    //     // Base weights for different net gain scenarios
    //     const baseWeightsForWin = [50, 30, 10, 5, 3];  // Used when netGain > 0
    //     const baseWeightsForLoss = [5, 10, 30, 50, 80]; // Used when netGain < 0

    //     // Adjust weights based on net gain/loss
    //     const baseWeights = (netGain > 0) ? baseWeightsForLoss:baseWeightsForWin ;

    //     // We need to dynamically adjust the weights based on the number of multipliers (possibleOutcomes.length)
    //     const weightAdjustmentFactor = Math.ceil(baseWeights.length / possibleOutcomes.length);

    //     // Generate the weighted probabilities array dynamically
    //     const weightedProbabilities = [];

    //     possibleOutcomes.forEach((multiplier, index) => {
    //         // Calculate the appropriate weight for this multiplier based on its position and adjusted length
    //         let weightIndex = Math.min(index, baseWeights.length - 1);  // Ensure we don't go out of bounds
    //         let weight = baseWeights[weightIndex] * weightAdjustmentFactor;

    //         // Add the multiplier to the weighted probabilities based on its weight
    //         weightedProbabilities.push(...Array(weight).fill(multiplier));
    //     });

    //     console.log("weightedProbabilities:", weightedProbabilities);

    //     // Randomly select a drop position from the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition:", dropPosition);

    //     // Get the multiplier based on the drop position
    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier:", multiplier);

    //     return { dropPosition, multiplier };
    // }
    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     console.log('possibleOutcomes:', possibleOutcomes);

    //     // Fetch the user's betting history
    //     const totalBets = await Bet.findAll({
    //         where: { userId,gameId:9 },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });

    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     const netGain = totalWin - totalBet;
    //     console.log("netGain:", netGain);

    //     // Base weights for different net gain scenarios
    //     const baseWeightsForWin = [50, 30, 10, 5, 3];  // Used when netGain > 0
    //     const baseWeightsForLoss = [5, 10, 30, 50, 80]; // Used when netGain < 0

    //     // Determine the base weights depending on netGain
    //     const baseWeights = (netGain > 0) ? baseWeightsForWin : baseWeightsForLoss;

    //     // Middle index calculation
    //     const middleIndex = Math.floor(possibleOutcomes.length / 2);

    //     // Weight adjustment factor to scale based on array length
    //     const weightAdjustmentFactor = Math.ceil(baseWeights.length / possibleOutcomes.length);

    //     // Generate weighted probabilities, emphasizing middle values
    //     const weightedProbabilities = [];

    //     possibleOutcomes.forEach((multiplier, index) => {
    //         let weight;
    //         if (index === middleIndex) {
    //             // Heavily weight the middle value
    //             weight = 100;
    //         } else if (index === middleIndex - 1 || index === middleIndex + 1) {
    //             // Slightly less weight for values adjacent to the middle
    //             weight = 50;
    //         } else if (index === 0 || index === possibleOutcomes.length - 1) {
    //             // Very low weight for edge values (rare occurrence)
    //             weight = 2;
    //         } else {
    //             // Default weight for other values
    //             weight = 20;
    //         }

    //         // Adjust weight based on user's net gain/loss
    //         let weightIndex = Math.min(index, baseWeights.length - 1);  // Ensure we don't go out of bounds
    //         weight *= weightAdjustmentFactor * baseWeights[weightIndex];

    //         // Add the multiplier to the weighted probabilities based on its weight
    //         weightedProbabilities.push(...Array(weight).fill(multiplier));
    //     });

    //     console.log("weightedProbabilities:", weightedProbabilities);

    //     // Randomly select a drop position from the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition:", dropPosition);

    //     // Get the multiplier based on the drop position
    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier:", multiplier);

    //     return { dropPosition, multiplier };
    // }
    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     console.log('possibleOutcomes:', possibleOutcomes);

    //     // Fetch the user's betting history
    //     const totalBets = await Bet.findAll({
    //         where: { userId, gameId: 9 },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });

    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     const netGain = totalWin - totalBet;
    //     console.log("netGain:", netGain);

    //     // Adjust weights based on whether user is in profit or loss
    //     const inProfit = netGain > 0;

    //     // Base weights for different positions
    //     let baseWeights;
    //     if (inProfit) {
    //         // If the user is in profit, favor the middle (lower multipliers)
    //         baseWeights = [5, 10, 20, 50, 100, 50, 20, 10, 5];
    //     } else {
    //         // If the user is at a loss, favor the sides (higher multipliers)
    //         baseWeights = [50, 40, 20, 10, 5, 10, 20, 40, 50];
    //     }

    //     // Weighted probabilities array
    //     const weightedProbabilities = [];

    //     possibleOutcomes.forEach((multiplier, index) => {
    //         const weight = baseWeights[index];
    //         weightedProbabilities.push(...Array(weight).fill(multiplier));
    //     });

    //     console.log("weightedProbabilities:", weightedProbabilities);

    //     // Randomly select a drop position from the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition:", dropPosition);

    //     // Get the multiplier based on the drop position
    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier:", multiplier);

    //     return { dropPosition, multiplier };
    // }

    // async function dropBall(rows, riskLevel, userId) {
    //     // Get the possible outcomes based on row and risk level
    //     const possibleOutcomes = rowConfigs[rows][riskLevel];
    //     console.log('possibleOutcomes:', possibleOutcomes);

    //     // Fetch the user's betting history
    //     const totalBets = await Bet.findAll({
    //         where: { userId, gameId: 9 },
    //         attributes: [
    //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
    //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
    //         ],
    //         raw: true
    //     });

    //     const totalBet = totalBets[0]?.totalBet || 0;
    //     console.log("totalBet:", totalBet);
    //     const totalWin = totalBets[0]?.totalWin || 0;
    //     console.log("totalWin:", totalWin);
    //     const netGain = totalWin - totalBet;
    //     console.log("netGain:", netGain);

    //     // Determine if the user is in profit or loss
    //     const inProfit = netGain > 0;

    //     // Function to generate weights dynamically based on the length of the possible outcomes
    //     // const generateWeights = (length, inProfit) => {
    //     //     const mid = Math.floor(length / 2); // Find the middle index
    //     //     const weights = [];

    //     //     for (let i = 0; i < length; i++) {
    //     //         if (inProfit) {
    //     //             // If in profit, favor middle (lower multipliers)
    //     //             const weight = Math.abs(i - mid) + 1; 
    //     //             weights.push(weight);
    //     //         } else {
    //     //             // If in loss, favor sides (higher multipliers)
    //     //             const weight = mid - Math.abs(i - mid); 
    //     //             weights.push(Math.max(weight, 1)); 
    //     //         }
    //     //     }

    //     //     return weights;
    //     // };

    //     // Function to generate weights dynamically based on the length of the possible outcomes
    //     // const generateWeights = (length, inProfit) => {
    //     //     const mid = Math.floor(length / 2); // Find the middle index
    //     //     const weights = [];

    //     //     for (let i = 0; i < length; i++) {
    //     //         if (inProfit) {
    //     //             // If in profit, heavily favor lower multipliers (lower indices)
    //     //             const weight = Math.abs(i - mid) + 1;
    //     //             if (i < mid) {
    //     //                 weights.push(weight * 3);
    //     //             } else {
    //     //                 weights.push(weight);
    //     //             }
    //     //         } else {
    //     //             // If in loss, favor sides (higher multipliers)
    //     //             const weight = mid - Math.abs(i - mid);
    //     //             weights.push(Math.max(weight, 1));
    //     //         }
    //     //     }

    //     //     return weights;
    //     // };

    //     const generateWeights = (length, inProfit) => {
    //         const mid = Math.floor(length / 2); // Find the middle index
    //         const weights = [];
        
    //         for (let i = 0; i < length; i++) {
    //             if (inProfit) {
    //                 // If in profit, heavily favor lower multipliers (lower indices)
    //                 const weight = Math.abs(i - mid) + 1;
    //                 if (i === mid) {
    //                     weights.push(weight * 5); // Increase weight for the middle index
    //                 } else if (i < mid) {
    //                     weights.push(weight * 2); // More weight for indices before the middle
    //                 } else {
    //                     weights.push(weight); // Normal weight for indices after the middle
    //                 }
    //             } else {
    //                 // If in loss, favor sides (higher multipliers)
    //                 const weight = mid - Math.abs(i - mid);
    //                 if (i === mid) {
    //                     weights.push(weight * 3); // Increase weight for the middle index
    //                 } else {
    //                     weights.push(Math.max(weight, 1)); // Ensure minimum weight of 1
    //                 }
    //             }
    //         }
        
    //         return weights;
    //     };


    //     // Generate weights based on the length of possible outcomes
    //     const baseWeights = generateWeights(possibleOutcomes.length, inProfit);

    //     // Create weighted probabilities based on the weights generated
    //     const weightedProbabilities = [];

    //     possibleOutcomes.forEach((multiplier, index) => {
    //         const weight = baseWeights[index];
    //         weightedProbabilities.push(...Array(weight).fill(multiplier));
    //     });

    //     console.log("weightedProbabilities:", weightedProbabilities);

    //     // Randomly select a drop position from the weighted probabilities
    //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
    //     console.log("dropPosition:", dropPosition);

    //     // Get the multiplier based on the drop position
    //     const multiplier = weightedProbabilities[dropPosition];
    //     console.log("multiplier:", multiplier);

    //     return { dropPosition, multiplier };
    // }
    async function dropBall(rows, riskLevel, userId) {
        // Get the possible outcomes based on row and risk level
        const possibleOutcomes = rowConfigs[rows][riskLevel];
        console.log('possibleOutcomes:', possibleOutcomes);
    
        // Fetch the user's betting history
        const totalBets = await Bet.findAll({
            where: { userId, gameId: 9 },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
                [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
            ],
            raw: true
        });
    
        const totalBet = totalBets[0]?.totalBet || 0;
        const totalWin = totalBets[0]?.totalWin || 0;
        const netGain = totalWin - totalBet;
        console.log("netGain:", netGain);
    
        // Determine if the user is in profit or loss
        const inProfit = netGain > 0;
    
        // Function to generate weights dynamically based on the length of the possible outcomes
        const generateWeights = (length, inProfit) => {
            const mid = Math.floor(length / 2); // Find the middle index
            const weights = [];
            
            // 90% of the time favor the middle position
            const weightMiddle = inProfit ? 100 : 50; // Higher weight if in profit, lower otherwise
            const weightAdjacent = inProfit ? 50 : 30; // Slightly lower weight for adjacent positions if in profit
            const weightOthers = inProfit ? 20 : 10;  // Lower weight for all other positions
            
            for (let i = 0; i < length; i++) {
                if (i === mid) {
                    weights.push(weightMiddle); // Heavily favor the middle position
                } else if (i === mid - 1 || i === mid + 1) {
                    weights.push(weightAdjacent); // Favor the positions adjacent to the middle
                } else {
                    weights.push(weightOthers); // Normal weight for other positions
                }
            }
            
            return weights;
        };
    
        // Generate weights based on the length of possible outcomes
        const baseWeights = generateWeights(possibleOutcomes.length, inProfit);
    
        // Create weighted probabilities based on the weights generated
        const weightedProbabilities = [];
    
        possibleOutcomes.forEach((multiplier, index) => {
            const weight = baseWeights[index];
            weightedProbabilities.push(...Array(weight).fill(multiplier));
        });
    
        console.log("weightedProbabilities:", weightedProbabilities);
    
        // Randomly select a drop position from the weighted probabilities
        const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
        console.log("dropPosition:", dropPosition);
    
        // Get the multiplier based on the drop position
        const multiplier = weightedProbabilities[dropPosition];
        console.log("multiplier:", multiplier);
    
        return { dropPosition, multiplier };
    }
    



    io.on('connection', (socket) => {
        console.log('New player connected');

        socket.on('plinkoPlaceBet', async (data) => {
            const { userId, betAmount, rows, riskLevel } = data;
            console.log(data);

            // Validate row configuration and risk level
            if (!rowConfigs[rows]) {
                socket.emit('error', { message: 'Invalid number of rows' });
                return;
            }
            if (!['low', 'medium', 'high'].includes(riskLevel)) {
                socket.emit('error', { message: 'Invalid risk level' });
                return;
            }

            // Simulate the ball drop
            const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId);
            console.log("dropPosition, multiplier::", dropPosition, multiplier);

            const winAmount = betAmount * multiplier;
            console.log("winAmount::", winAmount);

            // Store the bet result in the database
            try {
                await Bet.create({
                    gameId: 9,
                    userId,
                    betAmount,
                    multiplier,
                    winAmount,
                    rows,
                    risk: riskLevel,
                    betTime: new Date()
                });
                console.log(`Result: Multiplier=${multiplier}, Position=${dropPosition}, WinAmount=${winAmount}`);

                socket.emit('plinkoBetResult', { multiplier, dropPosition, winAmount });

                const lastBets = await Bet.findAll({
                    where: { userId, gameId: 9 },
                    order: [['betTime', 'DESC']],
                    limit: 4
                });

                const lastMultipliers = lastBets.map(bet => bet.multiplier);
                console.log(lastMultipliers);
                socket.emit('lastFourMultipliers', { multipliers: lastMultipliers });

            } catch (error) {
                console.error('Error saving bet:', error);
                socket.emit('error', { message: 'Failed to process bet' });
            }
        });
    });
};
