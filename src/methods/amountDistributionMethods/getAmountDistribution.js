import AmountDistribution from "../../models/AmountDistribution.js";
import Games from "../../models/Games.js";
import User from "../../models/user.js";

export const getAmountDistribution = async (req, res) => {
    try {
        // Extract filter parameters from query string
        const { page = 1, limit = 10 } = req.query;

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Fetch all AmountDistribution records including related User and Games with pagination
        const { rows: distributions, count: totalRecords } = await AmountDistribution.findAndCountAll({
            include: [
                {
                    model: User,
                    as: 'user', // Correct model reference
                    attributes: ['id', 'userName', 'email'], // Fetch specific fields
                },
                {
                    model: Games,
                    as: 'game', // Correct model reference
                    attributes: ['id', 'gameName'], // Fetch specific fields
                },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        // If no records found
        if (distributions.length === 0) {
            return res.status(404).json({ message: 'No amount distributions found' });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);

        // Return the records with pagination metadata
        return res.status(200).json({
            data: distributions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('Error fetching AmountDistribution records:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
