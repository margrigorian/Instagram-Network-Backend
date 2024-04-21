import express, { Application } from "express";
import cors from "cors";

const app: Application = express();
const PORT: number = 3001;

app.use(cors());
app.use(express.json());

app.listen(() => {
  console.log(`Server has started on PORT ${PORT}`);
});
