import bcript from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
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
    delete user.password; //  чтобы на front не был отправлен пароль
  }

  if (user && areSamePassword) {
    // пользователь зарегистрирован, все данные верны
    return user;
  } else {
    return null; // пользователь не зарегистрирован
  }
}

export async function addNewUser(login: string, username: string | undefined, contact: string, password: string): Promise<IUser | null> {
  const hashpassword = await bcript.hash(password, 10);
  const newUser = await addUser(login, username, contact, hashpassword);
  // проверка, требуемая типизацией
  if (newUser) {
    delete newUser.password; // чтобы на front не был отправлен пароль
  }

  return newUser;
}

export function getToken(login: string) {
  // id более надежен, так как к нему мы получаем доступ непосредственно после входа на страницу
  // login же виден всем
  const payload = {
    login
  };

  const token = jwt.sign(payload, secret, { expiresIn: "12h" });
  return token;
}

export async function checkToken(token: string): Promise<IUser | null> {
  try {
    const decodedToken: string | JwtPayload = jwt.verify(token, secret); // при ошибке пробрасывает throw

    if (typeof decodedToken === "object") {
      const user = await getUser(decodedToken.login); // проверка наличия юзера с таким id, возращ. объект c пользователем

      if (user) {
        // пользователь найден
        return user;
      }
    }

    return null;
  } catch (err) {
    return null; // в случае ошибки jwt.verify
  }
}
