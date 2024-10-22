import Logs from '../../models/Logs.js';
import Games from "../../models/Games.js";
import { addLog } from '../../utility/logs.js';
import { Op } from 'sequelize';
import Pull from '../../models/Pull.js';

export const findAllGames = async (req, res) => {
    try {
        // Extract pagination and search parameter from query
        // const { page = 1, limit = 10, search } = req.query;
        const { search } = req.query;
        // Validate pagination parameters
        // const pageNumber = parseInt(page, 10);
        // const pageSize = parseInt(limit, 10);

        // if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber <= 0 || pageSize <= 0) {
        //     return res.status(400).json({ message: "Invalid pagination parameters" });
        // }

        // await addLog(null, 'admin', 'INFO', `Find all games attempt - Page: ${pageNumber}, Limit: ${pageSize}, Search: ${search || 'None'}`);

        // Calculate offset for pagination
        // const offset = (pageNumber - 1) * pageSize;

        // Build filter conditions based on the search parameter
        const where = {};

        if (search) {
            const searchQuery = { [Op.like]: `%${search}%` }; // Partial match for the search term
            where[Op.or] = [
                { gameName: searchQuery },       // Search in 'name' field
                { gameType: searchQuery }   // Search in 'gameType' field
                // Add more fields if needed
            ];
        }

        // Retrieve games with pagination and search filtering
        const games = await Games.findAll({
            where,
            // limit: pageSize,
            // offset,
            // order: [['createdAt', 'DESC']], // Optional: order by creation date
        });

        const totalGames = await Games.count({ where }); // Count total games matching the filter

        if (!games.length) {
            await addLog(null, 'admin', 'INFO', 'No games found');
            return res.status(200).json({ message: "Data not found", response: [] });
        }

        const dataWithIsPull = await Promise.all(games.map(async (item) => {
            const pull = await Pull.findOne({
                where: {
                    gameId: item.id
                }
            });
        
            return {
                ...item.get(),
                isPull: !!pull
            };
        }));


        // Log successful game retrieval
        await addLog(null, 'admin', 'INFO', `Games retrieved successfully: ${games.length} games found`);

        res.status(200).json({
            message: "Data found",
            // totalGames,
            // totalPages: Math.ceil(totalGames / pageSize),
            // currentPage: pageNumber,
            games: dataWithIsPull
        });
    } catch (error) {
        await addLog(null, 'admin', 'ERROR', `Error retrieving games: ${error.message}`, 'SELF');
        console.log(error);
        
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const findGameById = async (req, res) => {
    try {
        // Extract gameId from request parameters
        const { gameId } = req.params;

        // Log the attempt to find the game by ID
        await addLog(null, 'admin', 'INFO', `Find game attempt - Game ID: ${gameId}`);

        // Check if gameId is a valid number
        if (isNaN(gameId)) {
            await addLog(null, 'admin', 'ERROR', `Invalid game ID: ${gameId}`);
            return res.status(400).json({ message: "Invalid game ID" });
        }

        // Find the game by its ID
        const game = await Games.findByPk(gameId);

        if (!game) {
            await addLog(null, 'admin', 'INFO', `Game not found - Game ID: ${gameId}`);
            return res.status(404).json({ message: "Game not found" });
        }

        // Log successful game retrieval
        await addLog(null, 'admin', 'INFO', `Game retrieved successfully - Game ID: ${gameId}`);

        res.status(200).json({
            message: "Game found",
            game
        });
    } catch (error) {
        console.error(error);
        await addLog(null, 'admin', 'ERROR', `Error retrieving game by ID: ${error.message}`, 'SELF')
        res.status(500).json({ error: 'Internal server error' });
    }
};

