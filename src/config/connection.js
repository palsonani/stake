import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // 'mysql'
    logging: false, 
    pool: {
        max: 5, 
        min: 0, 
        acquire: 30000, 
        idle: 10000 
    }
});


// export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT, // 'mysql'
//     logging: false,
//     port:3306, 
//     pool: {
//         max: 5, 
//         min: 0, 
//         acquire: 30000, 
//         idle: 10000 
//     }
// });


// export const sequelize = new Sequelize('stake', 'stake_game', 'Axios@321', {
//     host: '13.201.116.58', // Your EC2 instance IP
//     dialect: 'mysql',      // Use 'mysql' for MySQL or 'postgres' for PostgreSQL
//     port: 3306,            // Change if using a different port (default for MySQL is 3306)
//     logging: false,        // Disable SQL query logging (optional)
//   });

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
