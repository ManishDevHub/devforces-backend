import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/user.route";

const PORT = process.env.PORT || 5000

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

interface AuthRequest extends Request{
     user?: any
    

}

app.use("/api/user", router);




app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
