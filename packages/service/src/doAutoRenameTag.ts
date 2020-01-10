import { createScanner } from './htmlScanner/htmlScanner';
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
  const scanner = createScanner(text);
  if (newWord.startsWith('</')) {
    scanner.stream.goTo(offset);
    const tagName = newWord.slice(2);
    const oldTagName = oldWord.slice(2);
    const parent = getPreviousOpeningTagName(
      scanner,
      scanner.stream.position,
      matchingTagPairs,
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
    const hasAdvanced = scanner.stream.advanceUntilEitherChar(
      ['>'],
      matchingTagPairs,
      true
    );
    if (!hasAdvanced) {
      return undefined;
    }
    scanner.stream.advance(1);
    const nextClosingTag = getNextClosingTagName(
      scanner,
      scanner.stream.position,
      matchingTagPairs,
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

// doAutoCompletionElementRenameTag('<a></b>', 3, '</b', '</a', [], () => false) //?
// TODO add to tests
// const text = `<button>{/* <button> */}</buttonn>`
// doAutoCompletionElementRenameTag(text, 30, [['/*', '*/']]) //?

// const text = `<div><!-- </div> --> </dddddddd>`
// doAutoCompletionElementRenameTag(text, 25, [['<!--', '-->']]) //?

// const text = `<a></b>`
// doAutoCompletionElementRenameTag(text, 6, [['<!--', '-->']]) //?
// const text = `<divvv>
//   <div></div>
// </divv>`
// doAutoCompletionElementRenameTag(text, 25, [['<!--', '-->']]) //?
// const text = `<divv>
//   <div>test</
// </divv>`
// doAutoCompletionElementRenameTag(text, 20, [['<!--', '-->']]) //?
// const text = `<>test</l>`
// doAutoCompletionElementRenameTag(text, 1, [['<!--', '-->']]) //?
// const text = `<svg2 >
// <circle cx="" />
// </svg>`
// doAutoCompletionElementRenameTag(text, 3, [['<!--', '-->']]) //?
// const text = `<aa target="_blank" href="blabla.com">
//     Bla Bla
// </a>`
// doAutoCompletionElementRenameTag(text, 2, 'html') //?

// const text = `<head>
//   <link>
// </headd>`
// doAutoCompletionElementRenameTag(text, 21, 'html') //?
// const text = `<head><link></headd>`
// doAutoCompletionElementRenameTag(text, 17, 'html', []) //?
