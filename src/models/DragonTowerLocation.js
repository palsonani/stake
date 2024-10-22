import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/connection.js';

class DragonTowerLocation extends Model {}

DragonTowerLocation.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
    betId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'bets', 
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    selectedTile: {
        type: DataTypes.STRING,
    },
    multiplier: {
        type: DataTypes.DECIMAL(8, 2)
    }
}, {
    sequelize,
    modelName:'dragon_tower_locations',
    tableName: 'dragon_tower_locations',
    timestamps: true,
});

export default DragonTowerLocation;