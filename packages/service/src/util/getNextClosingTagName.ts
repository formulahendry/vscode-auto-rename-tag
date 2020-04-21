import {
  ScannerFast,
  ScannerStateFast,
  TokenTypeFast
} from '../htmlScanner/htmlScannerFast';

export const getNextClosingTagName: (
  scanner: ScannerFast,
  initialOffset: number,
  isSelfClosingTag: (tagName: string) => boolean
) =>
  | {
      tagName: string;
      offset: number;
      seenRightAngleBracket: boolean;
    }
  | undefined = (scanner, initialOffset, isSelfClosingTag) => {
  let offset = initialOffset;
  let nextClosingTagName: string | undefined;
  let stack: string[] = [];
  let seenRightAngleBracket = false;
  let i = 0;
  scanner.stream.goTo(offset);
  do {
    const hasFoundChar = scanner.stream.advanceUntilEitherChar(
      ['<', '>'],
      false
    );
    if (!hasFoundChar) {
      return undefined;
    }
    const char = scanner.stream.peekRight();
    if (!['<', '>'].includes(char)) {
      return undefined;
    }
    if (char === '<') {
      if (scanner.stream.peekRight(1) === '/') {
        scanner.stream.advance(2);
        offset = scanner.stream.position;
        scanner.state = ScannerStateFast.AfterOpeningEndTag;
        const token = scanner.scan();
        if (token !== TokenTypeFast.EndTag) {
          return undefined;
        }
        const tokenText = scanner.getTokenText();
        if (stack.length) {
          const top = stack.pop();
          if (top !== tokenText) {
            // TODO
            // console.log(scanner.stream.position);
            // console.log(top);
            // console.log(tokenText);
            // console.error('no');
            return undefined;
          }
          continue;
        }
        nextClosingTagName = tokenText;
        if (nextClosingTagName !== undefined) {
          break;
        }
      }

      scanner.stream.advance(1);
      scanner.state = ScannerStateFast.AfterOpeningStartTag;
      const token = scanner.scan();
      if (token !== TokenTypeFast.StartTag) {
        return undefined;
      }
      const tokenText = scanner.getTokenText();
      if (isSelfClosingTag(tokenText)) {
        scanner.stream.advanceUntilEitherChar(['>'], true);
        scanner.stream.advance(1);
        continue;
      }
      stack.push(tokenText);
      continue;
    } else {
      if (scanner.stream.peekRight(1) === '') {
        return undefined;
      }
      // don't go outside of comment when inside
      if (scanner.stream.previousChars(2) === '--') {
        return undefined;
      }
      if (scanner.stream.peekLeft(1) === '/') {
        if (stack.length === 0) {
          return undefined;
        }
        stack.pop();
        scanner.stream.advance(1);
        continue;
      }
      scanner.stream.advance(1);
    }
  } while (true);

  return {
    tagName: nextClosingTagName,
    offset,
    seenRightAngleBracket
  };
};
