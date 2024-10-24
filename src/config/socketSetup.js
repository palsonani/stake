import http from 'http';
import dotenv from "dotenv";
import { Server } from 'socket.io';
import { chatSocketHandler } from '../Socket/chat.js';
import { crashSocketHandler } from '../Socket/crashGame.js';
import { minesSocketHandler } from '../Socket/minesGame.js';
import { limboSocketHandler } from '../Socket/limboGame.js';
import { plinkoSocketHandler } from '../Socket/plinkoGame.js';
import allowedOrigins from './allowedOrigins.js';
import { wheelSocketHandler } from '../Socket/wheelGame.js';
import { dragonTowerSocketHandler } from '../Socket/dragonTowerGame.js';
import { testSocketHandler } from '../Socket/test.js';

dotenv.config()

export function setupSockets(app) {

    // Create HTTP servers for each game
    const chatServer = http.createServer(app);
    const crashServer = http.createServer(app);
    const plinkoServer = http.createServer(app);
    const mineServer = http.createServer(app);
    const wheelServer = http.createServer(app);
    const limboServer = http.createServer(app);
    const dragonTowerServer = http.createServer(app);
    const testingServer = http.createServer(app);

    // Utility function to create socket servers
    function createSocketServer(serverInstance, path, allowedOrigins) {
        return new Server(serverInstance, {
            path: path,
            cors: {
                origin: allowedOrigins,
                methods: ['*']
            }
        });
    }

    // Create all socket servers using the utility function
    const chatIo = createSocketServer(chatServer, '/ws', allowedOrigins);
    const crashIo = createSocketServer(crashServer, '/ws', allowedOrigins);
    const plinkoIo = createSocketServer(plinkoServer, '/ws', allowedOrigins);
    const mineIo = createSocketServer(mineServer, '/ws', allowedOrigins);
    const wheelIo = createSocketServer(wheelServer, '/ws', allowedOrigins);
    const limboIo = createSocketServer(limboServer, '/ws', allowedOrigins);
    const dragonTowerIo = createSocketServer(dragonTowerServer, '/ws', allowedOrigins);
    const testIo = createSocketServer(testingServer, '/ws', allowedOrigins);

    // Setup handlers for each socket server
    chatSocketHandler(chatIo)
    crashSocketHandler(crashIo);
    plinkoSocketHandler(plinkoIo);
    minesSocketHandler(mineIo);
    limboSocketHandler(limboIo)
    wheelSocketHandler(wheelIo)
    testSocketHandler(testIo)
    dragonTowerSocketHandler(dragonTowerIo)

    return {
        chatServer,
        crashServer,
        plinkoServer,
        mineServer,
        wheelServer,
        limboServer,
        dragonTowerServer,
        testingServer,
        chatIo,
        crashIo,
        plinkoIo,
        mineIo,
        wheelIo,
        limboIo,
        dragonTowerIo
    };
}

export function startServers({
    chatServer,
    crashServer,
    plinkoServer,
    mineServer,
    wheelServer,
    limboServer,
    dragonTowerServer,
    testingServer
}) {

    const serverConfig = [
        { server: chatServer, port: process.env.CHATPORT, name: 'Chat server' },
        { server: crashServer, port: process.env.CRASHPORT, name: 'Crash game server' },
        { server: plinkoServer, port: process.env.PLINKOPORT, name: 'Plinko game server' },
        { server: mineServer, port: process.env.MINEPORT, name: 'Mine game server' },
        { server: wheelServer, port: process.env.WHEELPORT, name: 'Wheel game server' },
        { server: limboServer, port: process.env.LIMBOPORT, name: 'Limbo game server' },
        { server: dragonTowerServer, port: process.env.DRAGONTOWERPORT, name: 'Dragon Tower game server' },
        { server: testingServer, port: 3009, name: 'Testing server' }
    ];

    // Start each server
    serverConfig.forEach(({ server, port, name }) => {
        if (server) {
            server.listen(port, () => {
                console.log(`${name} is running on port ${port}`);
            });
        } else {
            console.error(`${name} is undefined`);
        }
    });
}
