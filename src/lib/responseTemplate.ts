export interface IResponse {
  data: null | object;
  error: null | Message;
}

type Message = {
  message: string;
};

function getResponseTemplate(): IResponse {
  return { data: null, error: null };
}

export default getResponseTemplate;
