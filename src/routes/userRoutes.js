import express from 'express'
import { authenticateJWT, authorizeRoles } from '../utility/auth.js';
import { findUserMethod } from '../methods/userMethods/find.js';
import { loginUserMethod } from '../methods/userMethods/login.js';
import { userFilter } from '../methods/filterMethods/userFilter.js';
import { createUserMethod } from '../methods/userMethods/create.js';
import { deleteUserMethod } from '../methods/userMethods/delete.js';
import { updateUserMethod } from '../methods/userMethods/update.js';
import { findByUserIdUserMethod } from '../methods/userMethods/find.js';
import { getUserHistoryById } from '../methods/filterMethods/userHistory.js';
import { verifyOtp } from '../methods/phoneVerificationMethods/verifyOtp.js';
import { sendOtp } from '../methods/phoneVerificationMethods/generateOtp.js';
import { toggleUserStatus } from '../methods/userMethods/toggleUserStatus.js';
import { passwordReset } from '../methods/forgetPasswordMethods/passwordReset.js';
import { firebaseLoginUserMethod } from '../methods/userMethods/firebaseLogin.js';
import { passwordResetToken } from '../methods/forgetPasswordMethods/passwordResetToken.js';
import { updateUserNotes } from '../methods/userMethods/updateUserNotes.js';
import { signoutUserMethod } from '../methods/userMethods/logOut.js';

const userRoutes = express.Router()

userRoutes.post('/add', createUserMethod)
userRoutes.get('/get', authenticateJWT,authorizeRoles('admin'), findUserMethod)
userRoutes.get('/get/:userId', authenticateJWT, findByUserIdUserMethod)
userRoutes.put('/edit/:userId', updateUserMethod)
userRoutes.delete('/delete/:userId', authenticateJWT,authorizeRoles('admin'), deleteUserMethod)
userRoutes.post('/login', loginUserMethod);
userRoutes.post('/firebaseLogin', firebaseLoginUserMethod);
userRoutes.post('/forgot-password', passwordResetToken)
userRoutes.post('/reset-password', passwordReset)
userRoutes.post('/send-otp', sendOtp)
userRoutes.post('/verify-otp', verifyOtp)
userRoutes.post('/:userId/status', authenticateJWT,authorizeRoles('admin'), toggleUserStatus)
userRoutes.put('/:id/notes', updateUserNotes);
userRoutes.post('/logout', signoutUserMethod);

userRoutes.get('/filter',authenticateJWT,authorizeRoles('admin'), userFilter)
userRoutes.get('/history/:userId',authenticateJWT,authorizeRoles('admin'), getUserHistoryById);

export default userRoutes