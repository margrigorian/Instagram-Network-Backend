import bcript from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "../lib/config.js";
import { getUser, addUser } from "../db/slices/users.js";
import { IUser } from "../db/types/usersSliceTypes.js";

export async function checkUser(login: string, password: string): Promise<IUser | null> {
  // будет исп. и при регистрации и при логине
  const user = await getUser(login); // будет проходить проверка в базе данных
  let areSamePassword: boolean = false;

  // user.password просит проверку из-за типизации
  if (user && user.password) {
    areSamePassword = await bcript.compare(password, user.password); // проверка соответствия пароля
    delete user.password; // чтобы на front не был отправлен пароль
  }

  if (user && areSamePassword) {
    // пользователь зарегистрирован, все данные верны
    return user;
  } else {
    return null; // пользователь не зарегистрирован
  }
}

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
