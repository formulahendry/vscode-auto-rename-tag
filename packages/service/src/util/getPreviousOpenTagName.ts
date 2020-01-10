import {
  ScannerFast,
  ScannerStateFast,
  TokenTypeFast
} from '../htmlScanner/htmlScannerFast';

export const getPreviousOpeningTagName: (
  scanner: ScannerFast,
  initialOffset: number,
  matchingTagPairs: readonly [string, string][],
  isSelfClosingTag: (tagName: string) => boolean
) =>
  | {
      tagName: string;
      offset: number;
      seenRightAngleBracket: boolean;
    }
  | undefined = (
  scanner,
  initialOffset,
  matchingTagPairs,
  isSelfClosingTag
) => {
  let offset = initialOffset + 1;
  let parentTagName: string | undefined;
  let stack: string[] = [];
  let seenRightAngleBracket = false;
  let selfClosing = false;
  outer: do {
    scanner.stream.goTo(offset - 2);
    const hasFoundChar = scanner.stream.goBackUntilEitherChar(
      ['<', '>'],
      matchingTagPairs,
      false
    );
    if (!hasFoundChar) {
      return undefined;
    }
    const char = scanner.stream.peekLeft(1);
    if (!['<', '>'].includes(char)) {
      return undefined;
    }
    if (char === '>') {
      if (scanner.stream.peekLeft(2) === '/') {
        selfClosing = true;
      }
      seenRightAngleBracket = true;
      scanner.stream.goBack(1);
      scanner.stream.goBackUntilEitherChar(['<'], matchingTagPairs, true);
      offset = scanner.stream.position;
    }
    // push closing tags onto the stack
    if (scanner.stream.peekRight() === '/') {
      offset = scanner.stream.position;
      scanner.stream.advance(1);
      scanner.state = ScannerStateFast.AfterOpeningEndTag;
      scanner.scan();
      const token = scanner.getTokenText();
      if (token === '') {
        offset = scanner.stream.position - 1;
        continue;
      }
      stack.push(scanner.getTokenText());
      continue;
    }
    offset = scanner.stream.position;
    scanner.state = ScannerStateFast.AfterOpeningStartTag;
    const token = scanner.scan();
    if (token !== TokenTypeFast.StartTag) {
      return undefined;
    }
    const tokenText = scanner.getTokenText();
    if (selfClosing) {
      selfClosing = false;
      continue;
    }
    if (isSelfClosingTag(tokenText)) {
      continue;
    }
    // pop closing tags from the tags
    inner: while (stack.length) {
      let top = stack.pop();
      if (top === tokenText) {
        continue outer;
      }
      if (isSelfClosingTag(top!)) {
        continue inner;
      }
      return undefined;
    }

    parentTagName = tokenText;
    if (parentTagName !== undefined) {
      break;
    }
  } while (true);

  return {
    tagName: parentTagName,
    offset,
    seenRightAngleBracket
  };
};
