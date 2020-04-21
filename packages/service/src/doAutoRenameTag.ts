import {
  createScannerFast,
  ScannerStateFast
} from './htmlScanner/htmlScannerFast';
import { getPreviousOpeningTagName } from './util/getPreviousOpenTagName';
import { getNextClosingTagName } from './util/getNextClosingTagName';

export const doAutoRenameTag: (
  text: string,
  offset: number,
  newWord: string,
  oldWord: string,
  matchingTagPairs: readonly [string, string][],
  isSelfClosingTag: (tagName: string) => boolean
) =>
  | {
      startOffset: number;
      endOffset: number;
      tagName: string;
    }
  | undefined = (
  text,
  offset,
  newWord,
  oldWord,
  matchingTagPairs,
  isSelfClosingTag
) => {
  const scanner = createScannerFast({
    input: text,
    initialOffset: 0,
    initialState: ScannerStateFast.WithinContent,
    matchingTagPairs
  });
  if (newWord.startsWith('</')) {
    scanner.stream.goTo(offset);
    const tagName = newWord.slice(2);
    const oldTagName = oldWord.slice(2);
    const parent = getPreviousOpeningTagName(
      scanner,
      scanner.stream.position,
      isSelfClosingTag
    );
    if (!parent) {
      return undefined;
    }
    if (parent.tagName === tagName) {
      return undefined;
    }
    if (parent.tagName !== oldTagName) {
      return undefined;
    }
    const startOffset = parent.offset;
    const endOffset = parent.offset + parent.tagName.length;
    return {
      startOffset,
      endOffset,
      tagName
    };
  } else {
    scanner.stream.goTo(offset + 1);
    const tagName = newWord.slice(1);
    const oldTagName = oldWord.slice(1);
    const hasAdvanced = scanner.stream.advanceUntilEitherChar(['>'], true);
    if (!hasAdvanced) {
      return undefined;
    }
    if (scanner.stream.peekLeft(1) === '/') {
      return undefined;
    }
    scanner.stream.advance(1);
    const nextClosingTag = getNextClosingTagName(
      scanner,
      scanner.stream.position,
      isSelfClosingTag
    );
    if (!nextClosingTag) {
      return undefined;
    }
    if (nextClosingTag.tagName === tagName) {
      return undefined;
    }
    if (nextClosingTag.tagName !== oldTagName) {
      return undefined;
    }
    const startOffset = nextClosingTag.offset;
    const endOffset = nextClosingTag.offset + nextClosingTag.tagName.length;
    return {
      startOffset,
      endOffset,
      tagName
    };
  }
};
