import cors from 'cors';
import dotenv from "dotenv";
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser';
import userRoutes from './src/routes/userRoutes.js'
import gameRoutes from './src/routes/gameRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import medalRoutes from './src/routes/medalRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import allowedOrigins from './src/config/allowedOrigins.js';
import { getImage } from './src/methods/gameMethods/getImage.js';
import { setupSockets, startServers } from './src/config/socketSetup.js';

dotenv.config()
const app = express()
app.use(cookieParser()); 
app.use(bodyParser.json())

// CORS options
const corsOptions = {
    origin: allowedOrigins,
    methods: ['*'],
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Setup socket.io servers and handlers
const {
    chatServer,
    crashServer,
    plinkoServer,
    mineServer,
    wheelServer,
    limboServer,
    dragonTowerServer,
    chatIo,
    crashIo,
    plinkoIo,
    mineIo,
    wheelIo,
    limboIo,
    dragonTowerIo
} = setupSockets(app);

// Middleware to attach socket.io instances
app.use((req, res, next) => {
    req.crashIo = crashIo;
    req.plinkoIo = plinkoIo;
    req.mineIo = mineIo;
    req.chatIo = chatIo;
    req.wheelIo = wheelIo;
    req.limboIo = limboIo;
    req.dragonTowerIo = dragonTowerIo;
    next();
});

app.use('/v1/medals', medalRoutes);
app.use('/v1/user', userRoutes)
app.use('/v1/user', paymentRoutes)
app.use('/v1/game', gameRoutes)
app.use('/v1/admin', adminRoutes)
app.get('/image/:filename', getImage);
app.use('/v1/wallet', walletRoutes)

// Serve the static files from the 'public' directory
app.use(express.static('public'));

// Start the servers
startServers({
    chatServer,
    crashServer,
    plinkoServer,
    mineServer,
    wheelServer,
    limboServer,
    dragonTowerServer
});

const port = process.env.PORT
app.listen(port, () => {
    console.log('listening on port 3000')
})