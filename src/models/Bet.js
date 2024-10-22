import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';

class Bet extends Model { }

Bet.init({

    betType: {
        type: DataTypes.STRING(50)
    },
    gameId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'games',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    userId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    betAmount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    cashOutAt: {
        type: DataTypes.DECIMAL(10, 2)
    },
    profitOnWin: {
        type: DataTypes.DECIMAL(10, 2)
    },
    multiplier: {
        type: DataTypes.DECIMAL(10, 2)
    },
    mines: {
        type: DataTypes.INTEGER
    },
    gems: {
        type: DataTypes.INTEGER
    },
    risk: {
        type: DataTypes.STRING(50)
    },
    segment: {
        type: DataTypes.STRING(50)
    },
    difficulty: {
        type: DataTypes.STRING(50)
    },
    numberOfBets: {
        type: DataTypes.INTEGER
    },
    onWins: {
        type: DataTypes.INTEGER
    },
    onLoss: {
        type: DataTypes.INTEGER
    },
    rows: {
        type: DataTypes.INTEGER
    },
    stopOnProfit: {
        type: DataTypes.DECIMAL(10, 2)
    },
    stopOnLoss: {
        type: DataTypes.DECIMAL(10, 2)
    },
    betTime: {
        type: DataTypes.DATE
    },
    winAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue:0
    },
    isActive: {    // Adding isActive field
        type: DataTypes.BOOLEAN,
        defaultValue: true    // Default to true when the game starts
    }
}, {
    sequelize,
    modelName: 'bets',
    tableName: 'bets',
    timestamps: false
});

export default Bet;
