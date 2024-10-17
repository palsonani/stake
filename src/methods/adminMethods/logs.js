import { Op } from 'sequelize';
import Logs from '../../models/Logs.js'; // Ensure correct import path
import User from '../../models/user.js';

export const getLogs = async (req, res) => {
    try {
        const { searchQuery, page = 1, limit = 10, startDate, endDate } = req.query;

        let whereClause = {};

        // If searchQuery is provided, search across multiple columns
        if (searchQuery) {
            whereClause = {
                [Op.or]: [
                    { userId: { [Op.like]: `%${searchQuery}%` } },
                    { userName: { [Op.like]: `%${searchQuery}%` } },
                    { performOn: { [Op.like]: `%${searchQuery}%` } },
                    { actionType: { [Op.like]: `%${searchQuery}%` } },
                    { actionDescription: { [Op.like]: `%${searchQuery}%` } }
                ]
            };
        }

        // If startDate and endDate are provided, filter logs between these dates
        if (startDate && endDate) {
            whereClause.logTime = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Convert page and limit to numbers
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);

        // Calculate offset
        const offset = (pageNumber - 1) * pageSize;

        // Fetch logs based on the searchQuery, page, and limit
        const { count, rows } = await Logs.findAndCountAll({
            where: whereClause,
            limit: pageSize,
            offset
        });

        // Calculate total pages
        const totalPages = Math.ceil(count / pageSize);

        // Return the logs response
        res.status(200).json({
            totalItems: count,
            totalPages,
            currentPage: pageNumber,
            pageSize,
            logs: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};
