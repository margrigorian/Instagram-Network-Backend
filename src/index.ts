import express, { Application } from "express";
import cors from "cors";
import authRouter from "./routing/authRouter.js";
import accountRouter from "./routing/accountRouter.js";

const app: Application = express();
const PORT: number = 3001;

app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/account", accountRouter);

app.listen(PORT, () => {
  console.log(`Server has started on PORT ${PORT}`);
});
