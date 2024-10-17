import express from 'express';
import { createGame } from '../methods/gameMethods/create.js';
import { updateGame } from '../methods/gameMethods/update.js';
import { toggleGameStatus } from '../methods/gameMethods/toggleGameStatus.js';
import { authenticateJWT, authorizeRoles } from '../utility/auth.js';
import { findAllGames, findGameById } from '../methods/gameMethods/find.js';
import { getGameHistory } from '../methods/gameMethods/history.js';
import { upload } from '../utility/imageUplode.js';
import { getrendomUser } from '../methods/gameMethods/rendomUser.js';
import { getLastFiveCrashPoints, getLastFiveLimboPoints } from '../methods/gameMethods/LastFiveCrashPoints.js';
import { getGameInformation } from '../methods/gameMethods/information.js';

const gameRoutes = express.Router();

gameRoutes.post('/add', authenticateJWT, authorizeRoles('admin'), upload.single('image'), createGame);
gameRoutes.put('/edit/:gameId', authenticateJWT, authorizeRoles('admin'), updateGame);
gameRoutes.post('/:gameId/status', authenticateJWT, authorizeRoles('admin'), toggleGameStatus);
gameRoutes.get('/get', findAllGames);
gameRoutes.get('/get/:gameId', authenticateJWT, authorizeRoles('admin'), findGameById);
gameRoutes.get('/history/:gameId', getGameHistory);
gameRoutes.get('/random-users', getrendomUser);
gameRoutes.get('/LastFiveCrashPoints', getLastFiveCrashPoints)
gameRoutes.get('/GameInformation/:gameId', authenticateJWT, authorizeRoles('admin'), getGameInformation)
gameRoutes.get('/LastFiveCrashPoints/:gameId', getLastFiveLimboPoints)

export default gameRoutes;
