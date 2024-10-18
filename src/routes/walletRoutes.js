import express from 'express';
import { redeemCoupon } from '../methods/walletMethods/redeemCoupon.js';
import { generateCoupon } from '../methods/walletMethods/generateCoupen.js';
import { createWallet } from '../methods/walletMethods/createWallet.js';
import { getWallet } from '../methods/walletMethods/find.js';

const walletRoutes = express.Router();

walletRoutes.post('/generate', generateCoupon);
walletRoutes.post('/redeem', redeemCoupon)
walletRoutes.post('/create/:userId', createWallet)
walletRoutes.get('/get/:userId', getWallet)

export default walletRoutes;
