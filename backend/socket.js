let io;

module.exports = {
    init: httpServer=> {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: '*'
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Nie zainicjalizowano socket.io')
        }
        return io;
    }
}