import express from 'express'
import { createOrder } from '../methods/paymentMethods/cretaeOrder.js';
import { verifyPayment } from '../methods/paymentMethods/verifyPayment.js';

const paymentRoutes = express.Router()

paymentRoutes.post('/create-order', createOrder);
paymentRoutes.post('/verify-signature', verifyPayment);

export default paymentRoutes