import bcrypt from 'bcrypt';
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';
import Wallet from './Wallet.js';
import FinancialTransaction from './financialTransaction.js';
import Medal from './Medals.js';
import Bet from './Bet.js';
import Payment from './Payment.js';
import AmountDistribution from './AmountDistribution.js';

class User extends Model {
    async updateMedal() {
        const totalWinAmount = await Bet.sum('winAmount', { where: { userId: this.id } });
        const medal = await Medal.findOne({
            where: {
                winAmount: {
                    [sequelize.Op.lte]: totalWinAmount,
                }
            },
            order: [['winAmount', 'DESC']],
        });

        if (medal) {
            this.medalId = medal.id;
            await this.save();
        }
    }
}

User.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    countryCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobileNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    DOB: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postalcode: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    occupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referralUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referFrom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    medalId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'medals',
            key: 'id'
        },
        defaultValue: 1,
        onDelete: 'SET NULL'
    }
}, {
    sequelize, // Pass the Sequelize instance
    modrelName: 'users',
    tableName: 'users',
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password') || user.isNewRecord) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});
User.belongsTo(Medal, { foreignKey: 'medalId', as: 'medal' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
User.hasMany(FinancialTransaction, { foreignKey: 'userId', as: 'financialTransactions' });
User.hasMany(Bet, { as: 'bets', foreignKey: 'userId' });
Bet.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(Payment, { as: 'payments', foreignKey: 'userId' });
Payment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(AmountDistribution, { foreignKey: 'userId', as: 'amountDistributions' });
AmountDistribution.belongsTo(User, { foreignKey: 'userId', as: 'user' });


export default User;
