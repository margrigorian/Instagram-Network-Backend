import bcript from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "../lib/config.js";
import { addUser } from "../db/slices/users.js";
import { IUser } from "../db/types/usersSliceTypes.js";

export async function addNewUser(contact: string, login: string, username: string | undefined, password: string): Promise<IUser | null> {
  const hashpassword = await bcript.hash(password, 10);
  const newUser = await addUser(contact, login, username, hashpassword);
  // проверка, требуемая типизацией
  if (newUser) {
    // чтобы на front не был отправлен пароль
    delete newUser.password;
  }

  return newUser;
}

export function getToken(login: string) {
  const payload = {
    login
  };

  const token = jwt.sign(payload, secret, { expiresIn: "12h" });
  return token;
}
