import Chat from '../models/chat.js';

export const chatSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('user connected to Chat');

        // Join a room based on the user's country
        socket.on('joinCountry', async (country) => {
            socket.join(country);
            socket.country = country; 
            console.log(`User joined country: ${country}`);
            if (socket.country === "India") {
                const newChat = await Chat.findAll({
                    where: { country: socket.country }  
                });
                socket.emit("changeCountryResponse", newChat);
            }
        });

        // Handle incoming chat messages
        socket.on('chatMessage', async (data) => {
            const newChat = await Chat.create({
                userId: data.userId,
                content: data.content,
                country: socket.country,  
                taggedUserId: data.taggedUserId,
                createdAt: new Date() 
            });
            // Broadcast the message to everyone in the same country
            io.to(socket.country).emit('chatMessage', newChat);
        });

        // Handle country change
        socket.on('changeCountry', async (newCountry) => {
            socket.leave(socket.country);
            socket.join(newCountry);
            socket.country = newCountry;
            console.log(`User switched to country: ${newCountry}`);

            const newChat = await Chat.findAll({
                where: { country: socket.country }  
            });
            socket.emit("changeCountryResponse", newChat);
            // console.log(newChat);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
}
