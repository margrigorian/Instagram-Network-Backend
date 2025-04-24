import express, { Application } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import path from "path";
import authRouter from "./routing/authRouter.js";
import homeRouter from "./routing/homeRouter.js";
import accountRouter from "./routing/accountRouter.js";
import profileEditingRouter from "./routing/profileEditingRouter.js";
import newPostRouter from "./routing/newPostRouter.js";
import postRouter from "./routing/postRouter.js";
import exploreRouter from "./routing/exploreRouter.js";
import chatsRouter from "./routing/chatsRouter.js";
import { addSocketToDB, deleteSocketFromDB, getChatParticipantsSockets } from "./servicing/socketService.js";
import { IChat, IMessage } from "./db/types/chatsAndMessagesSliceTypes.js";
import { IListedAccount } from "./db/types/accountsSliceTypes.js";
import { ISocket } from "./db/types/socketSliceTypes.js";

const app: Application = express();
// создаем http-сервер, который будет исп. приложение express для обработки входящих http-запросов
const server = http.createServer(app);
// создаем сервер socketIO, который будет привязан к http-серверу
// и который будет исп. его для прослушивания событий webSocket-соединения
const socketIO = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"] // Разрешенные HTTP-методы
  }
});

const PORT: number = 3001;
const currentFolderPath = path.resolve();
app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/home", homeRouter);
app.use("/accounts", accountRouter);
app.use("/profile", profileEditingRouter);
app.use("/users_avatars", express.static(path.join(currentFolderPath, "users_avatars"))); // постоянное исп. папки users_avatars
app.use("/new_post", newPostRouter);
app.use("/posts_images", express.static(path.join(currentFolderPath, "posts_images")));
app.use("/p", postRouter);
app.use("/explore", exploreRouter);
app.use("/direct", chatsRouter);

socketIO.on("connection", (socket: Socket) => {
  console.log(`User with ${socket.id} has connected`);

  socket.on("login", async (data: { login: string }) => {
    // костыль + остается вопрос безопасного доступа
    await addSocketToDB(data.login, socket.id);
  });

  socket.on("addChat", async (data: { chat: IChat }) => {
    let sockets: ISocket[] = [];
    // проверка, требуемая типизацией
    if (data.chat.participants) {
      sockets = await getChatParticipantsSockets(data.chat.participants);
    }
    // делаем рассылку по socket_id
    sockets.map(el => {
      socketIO.to(el.socket_id).emit("chat", data.chat);
    });
  });

  socket.on("sendMessage", async (data: { message: IMessage; participants: IListedAccount[] }) => {
    let sockets: ISocket[] = await getChatParticipantsSockets(data.participants);
    sockets.map(el => {
      socketIO.to(el.socket_id).emit("message", data.message);
    });
  });

  socket.on("deleteMessage", async (data: { chatId: number; messageId: number; participants: IListedAccount[] }) => {
    let sockets: ISocket[] = await getChatParticipantsSockets(data.participants);
    sockets.map(el => {
      socketIO.to(el.socket_id).emit("deletedMessage", { chatId: data.chatId, messageId: data.messageId });
    });
  });

  socket.on("disconnect", async () => {
    await deleteSocketFromDB(socket.id);
    console.log(`User with ${socket.id} has disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Server has started on PORT ${PORT}`);
});
