import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';  
import PullPlayer from './PullPlayer.js';
import Games from './Games.js';

class Pull extends Model {
   
}

Pull.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    crashPoint: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    pullTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    modelName: 'pulls',
    tableName: 'pulls',
    timestamps: false,
});
Pull.hasMany(PullPlayer, { foreignKey: 'pullId' });
// Pull.belongsTo(Games, { foreignKey: 'gameId', as: 'game' });
export default Pull;
