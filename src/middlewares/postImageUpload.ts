import multer from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    cb(null, "posts_images"); // вторым параметром передается путь к папке, где будут храниться файлы
  },
  filename: function (req: Request, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // задаем имя файла
  }
});

const types = ["image/png", "image/jpeg", "image/jpg"];

const fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => void = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (types.includes(file.mimetype)) {
    cb(null, true); // файл прошел валидацию, ставим флаг true
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
