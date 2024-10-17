import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/connection.js';

class MineLocation extends Model {}

MineLocation.init({
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
    tileIndex: {
        type: DataTypes.INTEGER,
    },
    isMine: {
        type: DataTypes.TINYINT(1),
    },
    selected: {
        type: DataTypes.TINYINT(1),
        defaultValue: false,
    },
}, {
    sequelize,
    modelName : 'mine_locations',
    tableName: 'mine_locations',
    timestamps: false,
});

export default MineLocation;
