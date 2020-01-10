import {
  doAutoRenameTag,
  isSelfClosingTagInLanguage,
  getMatchingTagPairs
} from 'service';
import {
  RequestType,
  TextDocument,
  TextDocumentIdentifier,
  TextDocuments
} from 'vscode-languageserver';

interface Tag {
  readonly word: string;
  readonly oldWord: string;
  readonly offset: number;
}
interface Params {
  readonly textDocument: TextDocumentIdentifier;
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

export const autoRenameTag: (
  documents: TextDocuments<TextDocument>
) => (params: Params) => Result[] = documents => ({ textDocument, tags }) => {
  const document = documents.get(textDocument.uri);
  if (!document) {
    return [];
  }
  // console.log("lang");
  // console.log(document.languageId);
  const text = document.getText();
  const matchingTagPairs = getMatchingTagPairs(document.languageId);
  const isSelfClosingTag: (
    tagName: string
  ) => boolean = isSelfClosingTagInLanguage(document.languageId);
  const results: Result[] = tags
    .map(tag => {
      const result = doAutoRenameTag(
        text,
        tag.offset,
        tag.word,
        tag.oldWord,
        matchingTagPairs,
        isSelfClosingTag
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
