"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class SocketIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app) {
        super(app);
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: ['http://localhost:3000', process.env.FRONT_URL],
                credentials: true,
                methods: ['GET', 'POST'],
            },
        });
        return server;
    }
}
exports.SocketIoAdapter = SocketIoAdapter;
//# sourceMappingURL=socket-io.adapter.js.map