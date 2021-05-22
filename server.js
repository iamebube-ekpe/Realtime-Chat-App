const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const formatMsg = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Dev variables
const PORT = 9090;
const admin = 'ADMIN';

// Setting static folder
app.use(express.static(path.join(__dirname, 'public')));

// Runs when a Client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcomes ONLY the user to the room
        socket.emit('message', formatMsg(admin, 'Welcome to the room!'));

        // Broadcasts when the user enters the room.. Doesnt show on the new user screen
        socket.broadcast
            .to(user.room)
            .emit('message', formatMsg(admin, `${user.username} joined the room.`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });



    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMsg(user.username, msg));
    });

    // Broadcasts when the user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMsg(admin, `${user.username} has left the room`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });
});



server.listen(PORT, () => console.log(`Server running on port ${PORT}`));