import express from 'express';
import { loginAdminMethod } from '../methods/adminMethods/login.js';
import { addCommission, deleteCommission, getAllCommissions, getAllCommissionsById, updateCommission } from '../methods/adminMethods/commission.js';
import { createAdminMethod } from '../methods/adminMethods/create.js';
import { authenticateJWT, authorizeRoles } from '../utility/auth.js';
import { adminDashbord } from '../methods/adminMethods/dashboard.js';
import { getLogs } from '../methods/adminMethods/logs.js';
import { addAmountDistribution } from '../methods/amountDistributionMethods/addAmountDistribution.js';
import { updateAmountDistribution } from '../methods/amountDistributionMethods/updateAmountDistribution.js';
import { deleteAmountDistribution } from '../methods/amountDistributionMethods/deleteAmountDistribution.js';
import { getAmountDistribution } from '../methods/amountDistributionMethods/getAmountDistribution.js';

const adminRoutes = express.Router();

adminRoutes.post('/signIn', loginAdminMethod);
adminRoutes.post('/signUp',authenticateJWT,authorizeRoles('admin') ,createAdminMethod);
adminRoutes.post('/commissions/add',authenticateJWT,authorizeRoles('admin') ,addCommission);
adminRoutes.put('/commissions/edit/:id',authenticateJWT,authorizeRoles('admin'), updateCommission);
adminRoutes.get('/commissions/get',authenticateJWT,authorizeRoles('admin'), getAllCommissions);
adminRoutes.get('/commissions/get/:id',authenticateJWT,authorizeRoles('admin'), getAllCommissionsById);
adminRoutes.get('/dashbord',authenticateJWT,authorizeRoles('admin'),adminDashbord);
adminRoutes.get('/logs',authenticateJWT,authorizeRoles('admin'),getLogs);
adminRoutes.delete('/commissions/delete/:id',authenticateJWT,authorizeRoles('admin'),deleteCommission)
adminRoutes.post('/amountdistributions',authenticateJWT,authorizeRoles('admin'), addAmountDistribution);
adminRoutes.get('/amountdistributions',authenticateJWT,authorizeRoles('admin'), getAmountDistribution);
adminRoutes.put('/amountdistributions/:id',authenticateJWT,authorizeRoles('admin'), updateAmountDistribution);
adminRoutes.delete('/amountdistributions/:id',authenticateJWT,authorizeRoles('admin'), deleteAmountDistribution);

export default adminRoutes;
