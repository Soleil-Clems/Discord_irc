"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsUser = void 0;
const common_1 = require("@nestjs/common");
exports.WsUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const client = ctx.switchToWs().getClient();
    const user = client.data.user;
    return data ? user?.[data] : user;
});
//# sourceMappingURL=ws-user.decorator.js.map