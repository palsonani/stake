import express from 'express';
import { redeemCoupon } from '../methods/walletMethods/redeemCoupon.js';
import { generateCoupon } from '../methods/walletMethods/generateCoupen.js';
import { createWallet } from '../methods/walletMethods/createWallet.js';

const walletRoutes = express.Router();

walletRoutes.post('/generate', generateCoupon);
walletRoutes.post('/redeem', redeemCoupon)
walletRoutes.post('/create', createWallet)

export default walletRoutes;
