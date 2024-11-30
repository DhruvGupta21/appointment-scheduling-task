import express from "express";
import "dotenv/config";
const app = express();
const PORT = process.env.PORT || 7000;
import path from 'path';
import { fileURLToPath } from 'url';
import Routes from "./routes/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));
app.use(Routes);
app.get("/", async (req, res) => {
    return res.json({ msg: "welcome to backend" });
});
//queues
import './jobs/index.js';
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
