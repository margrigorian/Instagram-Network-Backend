import { postComment } from "../db/slices/comments.js";
import { IComment } from "../db/types/commentsSliceTypes.js";
import { getHashtagsAndUserLinks } from "../lib/getHashtagsAndUserLinksFunction.js";

export async function getKeyWordsOfTextAndPostComment(
  post_id: string,
  content: string,
  under_comment: number | null,
  login: string
): Promise<IComment> {
  const keyWords = getHashtagsAndUserLinks(content);
  const comment = await postComment(content, keyWords.hashtags, keyWords.user_links, under_comment, post_id, login);
  return comment;
}
