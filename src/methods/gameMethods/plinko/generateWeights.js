export const generateWeights = (length, inProfit, totalBet, netGain) => {
    const mid = Math.floor(length / 2); // Find the middle index
    const weights = [];

    // Default weights
    const weightMiddle = inProfit ? 95 : 50; // High weight for middle position if in profit
    const weightAdjacent = inProfit ? 40 : 30; // Lower weight for adjacent positions if in profit
    const weightOthers = 5;  // Minimal weight for all other positions
    const rareWeight = 5; // 5% chance for the first two and last two positions

    // Adjust weights based on net gain and total bet amount
    if (netGain > totalBet) {
        // Increase the weight for the middle and adjacent positions
        for (let i = 0; i < length; i++) {
            if (i === 0 || i === 1 || i === length - 2 || i === length - 1) {
                weights.push(rareWeight);
            } else if (i === mid) {
                weights.push(weightMiddle); // Heavily favor the middle position
            } else if (i === mid - 1 || i === mid + 1) {
                weights.push(weightAdjacent); // Favor the adjacent positions
            } else {
                weights.push(weightOthers); // Minimal weight for other positions
            }
        }
    } else {
        // Regular weight assignment
        for (let i = 0; i < length; i++) {
            if (i === 0 || i === 1 || i === length - 2 || i === length - 1) {
                weights.push(rareWeight);
            } else if (i === mid) {
                weights.push(weightMiddle); // Heavily favor the middle position
            } else if (i === mid - 1 || i === mid + 1) {
                weights.push(weightAdjacent); // Favor the adjacent positions
            } else {
                weights.push(weightOthers); // Normal weight for other positions
            }
        }
    }

    return weights;
};