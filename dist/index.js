import express from "express";
import "dotenv/config";
const app = express();
const PORT = process.env.PORT || 7000;
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import Routes from "./routes/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));
app.use(Routes);
app.get("/", async (req, res) => {
    const html = await ejs.renderFile(__dirname + `/views/emails/welcome.ejs`, { name: "TheMechaNoob" });
    // await sendEmail("sahmir.keeland@dagberet.com", "tester", html)
    // return res.json({ msg: "success" });
    await emailQueue.add(emailQueueName, { to: "fetace7259@nausard.com", subject: "tester 2", body: html });
    return res.json({ msg: "success" });
});
//queues
import './jobs/index.js';
import { emailQueue, emailQueueName } from "./jobs/EmailJob.js";
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
