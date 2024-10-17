import express from 'express';
import { createMedal } from '../methods/medalMethods/create.js';
import { updateMedal } from '../methods/medalMethods/update.js';
import { authenticateJWT, authorizeRoles } from '../utility/auth.js';
import { getAllMedals } from '../methods/medalMethods/find.js';

const medalRoutes = express.Router();

medalRoutes.post('/add',authenticateJWT,authorizeRoles('admin'), createMedal);
medalRoutes.put('/edit/:medalId',authenticateJWT,authorizeRoles('admin'), updateMedal);
medalRoutes.get('/get',authenticateJWT,authorizeRoles('admin'), getAllMedals);

export default medalRoutes;
