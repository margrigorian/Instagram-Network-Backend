import express, { Application } from "express";
import cors from "cors";
import path from "path";
import authRouter from "./routing/authRouter.js";
import accountRouter from "./routing/accountRouter.js";
import profileEditingRouter from "./routing/profileEditingRouter.js";

const app: Application = express();
const PORT: number = 3001;
const currentFolderPath = path.resolve();

app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/accounts", accountRouter);
app.use("/profile", profileEditingRouter);
app.use("/users_avatars", express.static(path.join(currentFolderPath, "users_avatars"))); // постоянное исп. папки users_avatars

app.listen(PORT, () => {
  console.log(`Server has started on PORT ${PORT}`);
});
