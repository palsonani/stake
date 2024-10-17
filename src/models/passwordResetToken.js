import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 

class PasswordResetToken extends Model {
    // Add custom methods or hooks if needed
}

PasswordResetToken.init({
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id'
        }
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize, 
    modelName: 'password_reset_token',
    tableName: 'password_reset_tokens', 
    timestamps: false 
});

export default PasswordResetToken;
