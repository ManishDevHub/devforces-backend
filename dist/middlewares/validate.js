"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const console_1 = require("console");
const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation Failed",
                errors: result.error.flatten()
            });
        }
        req.body = result.data;
        next();
    }
    catch (err) {
        console.log("Validaton middleware error", console_1.error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err instanceof Error ? err.message : err,
        });
    }
};
exports.validate = validate;
