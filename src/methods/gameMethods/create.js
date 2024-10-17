import Games from "../../models/Games.js";
import { addLog } from "../../utility/logs.js";
import dotenv from 'dotenv';

dotenv.config();

export const createGame = async (req, res) => {
    try {
        const gameName = req.body.gameName;
        const gameType = req.body.gameType;
        const file = req.file;

        // Check if a file is uploaded
        if (!file) {
            await addLog(
                req.user ? req.user.id : null,
                'admin',
                'ERROR',
                'Attempted to create a game without providing an image.',
                'SELF'
            );
            return res.status(400).json({ message: 'No image provided' });
        }

        const imageUrl = process.env.IMAGE_URL+`/image/${file.filename}`;

        const newGame = await Games.create({
            gameName,
            gameType,
            gameImage: imageUrl
        });

        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'INFO',
            `Game created successfully: Name=${gameName}, Type=${gameType}, ImageURL=${imageUrl}`,
            'SELF'
        );

        res.status(201).json({ message: 'Game created successfully', newGame });
    } catch (error) {
        console.error(error);
        await addLog(
            req.user ? req.user.id : null,
            'admin',
            'ERROR',
            `Error creating game: ${error.message}`,
            'SELF'
        );
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};
