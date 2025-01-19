export function getHashtagsAndUserLinks(text: string) {
  const hashtags_array: string[] = [];
  const user_links_array: string[] = [];

  if (text.indexOf("#") !== -1) {
    selectKeyWords("#");
  }
  if (text.indexOf("@") !== -1) {
    selectKeyWords("@");
  }

  function selectKeyWords(symbol: string): void {
    // разбиваем по ключевому символу
    const arrayOfCaptionParts = text.split(symbol);
    arrayOfCaptionParts.shift(); // убираем первый пустой элемент - ""

    arrayOfCaptionParts.map(part => {
      // пробел, #, @; по идее проверок должно быть больше
      const key_word = part.slice(
        0,
        part.indexOf(" ") !== -1
          ? part.indexOf(" ")
          : part.indexOf("#") !== -1
            ? part.indexOf("#")
            : part.indexOf("@") !== -1
              ? part.indexOf("@")
              : part.length
      );

      if (key_word) {
        if (symbol === "#") {
          hashtags_array.push(symbol + key_word);
        } else {
          // логины не проверяем, все будут кликабельны (нет аккаунта - значит нет)
          // так представлено и в инстаграмме
          user_links_array.push(symbol + key_word);
        }
      }
    });
  }

  let hashtags: string;
  if (hashtags_array.length !== 0) {
    hashtags = hashtags_array.join(";");
  } else {
    hashtags = "";
  }

  let user_links: string;
  if (user_links_array.length !== 0) {
    user_links = user_links_array.join(";");
  } else {
    user_links = "";
  }

  return {
    hashtags,
    user_links
  };
}
