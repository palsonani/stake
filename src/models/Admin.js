import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 
import bcrypt from 'bcrypt';
class Admin extends Model {}

Admin.init({
    username: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'admin'
    },
}, {
    sequelize,
    modelName: 'admin',
    tableName: 'admin',
    timestamps: true,
    hooks: {
        beforeSave: async (admin) => {
            if (admin.changed('password') || admin.isNewRecord) {
                admin.password = await bcrypt.hash(admin.password, 10);
            }
        }
    }
});

export default Admin;