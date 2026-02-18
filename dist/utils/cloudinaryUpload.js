"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCloToBinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadCloToBinary = (buffer, folder, publicId) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder,
            public_id: publicId,
            overwrite: true,
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                console.error("Cloudinary Error:", error);
                return reject(error);
            }
            if (!result) {
                return reject(new Error("Cloudinary result is undefined"));
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
            });
        });
        stream.end(buffer);
    });
};
exports.uploadCloToBinary = uploadCloToBinary;
