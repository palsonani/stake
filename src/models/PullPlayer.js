import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';
import User from './user.js';

class PullPlayer extends Model { }

PullPlayer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    pullId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'pulls',
            key: 'id',
        },
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    cashoutMultiplier: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    winAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    isWinner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    pullTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    modelName: 'pullplayers',
    tableName: 'pullplayers',
    timestamps: false,
});

PullPlayer.belongsTo(User, { foreignKey: 'userId', as: 'users' });
export default PullPlayer;
