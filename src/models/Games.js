import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';
import AmountDistribution from './AmountDistribution.js';
import Pull from './Pull.js';
import Bet from './Bet.js';

class Games extends Model {
}

Games.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    gameName: {
        type: DataTypes.STRING(255)
    },
    gameType: {
        type: DataTypes.STRING(50)
    },
    gameImage: {
        type: DataTypes.STRING(255) 
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true 
    },
    isReload:{
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    }
}, {
    sequelize,
    modelName: 'games',
    tableName: 'games',
    timestamps: false
});

Games.hasMany(AmountDistribution, { foreignKey: 'gameId', as: 'amount_distributions' });
Games.hasMany(Pull, { foreignKey: 'gameId', as: 'pulls' })
AmountDistribution.belongsTo(Games, { foreignKey: 'gameId', as: 'game' });
Bet.belongsTo(Games, {foreignKey: 'gameId',as: 'game',onDelete: 'CASCADE'});
export default Games;
