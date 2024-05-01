export interface IResponse {
  data: null | object;
  error: null | Message;
}

type Message = {
  message: string;
};

function getResponseTemplate<T extends IResponse>(): T {
  return { data: null, error: null } as T;
}

export default getResponseTemplate;
