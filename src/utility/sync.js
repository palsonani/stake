import { sequelize } from '../config/connection.js'; 
// import Medal from '../models/Medals.js';
// import User from '../models/user.js';
// import PasswordResetToken from '../models/passwordResetToken.js';
// import chats from '../models/chat.js';
// import Payment from '../models/Payment.js';
// import Refund from '../models/Refund.js';
// import firebaseUser from '../models/firebaseUser.js'
// import Admin from '../models/Admin.js';
// import Games from '../models/Games.js';
// import Kyc from '../models/Kyc.js';
// import Wallet from '../models/Wallet.js';
// import Logs from '../models/Logs.js';
// import Commission from '../models/Commission.js';
// import GameStatus from '../models/financialTransaction.js';
// import Bet from '../models/Bet.js';
// import WalletTransaction from '../models/WalletTransaction.js';
// import Withdraw from '../models/Withdraw.js';
// import Pull from '../models/Pull.js';
// import PullPlayer from '../models/PullPlayer.js';
// import Coupon from '../models/Coupon.js';
// import AmountDistribution from '../models/AmountDistribution.js';
// import MineLocation from '../models/MineLocation.js';
const syncDatabase = async () => {
    try {
        // await sequelize.drop();
        // console.log('All tables dropped');
        // await Medal.sync({ force: true });
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing database:', error);
    }
};

syncDatabase();
