"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const prisma_js_1 = require("../config/prisma.js");
const createUser = async (req, res) => {
    try {
        const { email, name } = req.body;
        const user = await prisma_js_1.prisma.user.create({
            data: { email, name },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createUser = createUser;
