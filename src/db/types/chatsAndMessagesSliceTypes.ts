import { IListedAccount } from "./accountsSliceTypes.js";

export interface IChat {
  id: number;
  participants?: IListedAccount[];
  type: string;
  creators: string;
  // deleted_from? - чтобы при отправке ответа удалять данное поле
  deleted_from?: string | null;
  last_message?: IMessage;
}

export interface IMessage {
  id: number;
  message: string;
  // изначально при запросе string, потом будет преобразование к IListedAccount
  sender: string | IListedAccount;
  time: number;
  chat_id: number;
  is_read: number | boolean;
  // deleted_from? - чтобы при отправке ответа удалять данное поле
  deleted_from?: string | null;
}

export interface IInfoAboutUnreadMessageByUser {
  message_id: number;
  chat_id: number;
  user_login: string;
}
