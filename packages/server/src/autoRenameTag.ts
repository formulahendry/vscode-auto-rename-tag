import { doAutoRenameTag } from 'service';
import {
  RequestType,
  // TODO
  TextDocument,
  TextDocuments,
  VersionedTextDocumentIdentifier,
} from 'vscode-languageserver';

interface Tag {
  readonly word: string;
  readonly oldWord: string;
  readonly offset: number;
}
interface Params {
  readonly textDocument: VersionedTextDocumentIdentifier;
  readonly tags: Tag[];
}

interface Result {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly tagName: string;
  readonly originalWord: string;
  readonly originalOffset: number;
}

export const autoRenameTagRequestType = new RequestType<
  Params,
  Result[],
  any,
  any
>('$/auto-rename-tag');

const NULL_AUTO_RENAME_TAG_RESULT: Result[] = [];

export const autoRenameTag: (
  documents: TextDocuments<TextDocument>
) => (params: Params) => Promise<Result[]> = (documents) => async ({
  textDocument,
  tags,
}) => {
  await new Promise((r) => setTimeout(r, 20));
  const document = documents.get(textDocument.uri);
  if (!document) {
    return NULL_AUTO_RENAME_TAG_RESULT;
  }
  if (textDocument.version !== document.version) {
    return NULL_AUTO_RENAME_TAG_RESULT;
  }
  const text = document.getText();
  const results: Result[] = tags
    .map((tag) => {
      const result = doAutoRenameTag(
        text,
        tag.offset,
        tag.word,
        tag.oldWord,
        document.languageId
      );
      if (!result) {
        return result;
      }
      (result as any).originalOffset = tag.offset;
      (result as any).originalWord = tag.word;
      return result as Result;
    })
    .filter(Boolean) as Result[];
  return results;
};
