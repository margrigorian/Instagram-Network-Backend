import path from "path";
import fs from "fs/promises";
import { deleteAvatar, putAvatar } from "../db/slices/users.js";
import { IAvatar } from "../db/types/usersSliceTypes.js";

export async function putUserAvatar(login: string, old_avatar_path: string, new_avatar: string): Promise<IAvatar | null> {
  // так как указан путь вместе с http://localhost
  const old_avatar = old_avatar_path.slice(36);
  // удаляем изображение  из папки users_avatars
  const users_avatars_folder = path.join(path.resolve(), "users_avatars");
  const absolute_path_to_image: string = path.join(users_avatars_folder, old_avatar);
  await fs.unlink(absolute_path_to_image);
  // обновленный аватар
  return putAvatar(login, new_avatar);
}

export async function deleteUserAvatar(login: string, avatar_path: string): Promise<void> {
  await deleteAvatar(login);
  // так как указан путь вместе с http://localhost
  const avatar = avatar_path.slice(36);
  // удаляем изображение  из папки users_avatars
  const users_avatars_folder = path.join(path.resolve(), "users_avatars");
  const absolute_path_to_image: string = path.join(users_avatars_folder, avatar);
  await fs.unlink(absolute_path_to_image);
}
