"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const problem_route_1 = __importDefault(require("./routes/problem.route"));
const contest_route_1 = __importDefault(require("./routes/contest.route"));
const adminprofile_route_1 = __importDefault(require("./routes/adminprofile.route"));
const admin_problem_route_1 = __importDefault(require("./routes/admin.problem.route"));
const admin_contest_route_1 = __importDefault(require("./routes/admin.contest.route"));
const submission_route_1 = __importDefault(require("./routes/submission.route"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json());
app.use("/api/user", user_route_1.default);
app.use('/api/user', problem_route_1.default);
app.use('/api/user', contest_route_1.default);
app.use('/api/user', submission_route_1.default);
app.use('/api/admin', adminprofile_route_1.default);
app.use('/api/admin', admin_problem_route_1.default);
app.use('/api/admin', admin_contest_route_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
