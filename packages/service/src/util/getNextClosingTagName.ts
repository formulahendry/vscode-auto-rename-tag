import { Scanner, ScannerState, TokenType } from '../htmlScanner/htmlScanner';

export const getNextClosingTagName: (
  scanner: Scanner,
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
  // console.log(initialOffset);
  let offset = initialOffset;
  let nextClosingTagName: string | undefined;
  let stack: string[] = [];
  let seenRightAngleBracket = false;
  let i = 0;
  scanner.stream.goTo(offset);
  do {
    if (i++ > 10000000) {
      // TODO show ui error (Auto Rename Tag does not work for this tag because the matching tag is too far away.)
      throw new Error('probably infinite loop');
    }
    // console.log('get next closing');
    const hasFoundChar = scanner.stream.advanceUntilEitherChar(
      ['<', '>'],
      matchingTagPairs,
      false
    );
    if (!hasFoundChar) {
      return undefined;
    }
    const char = scanner.stream.peekRight(); //?
    if (!['<', '>'].includes(char)) {
      return undefined;
    }
    if (char === '<') {
      if (scanner.stream.peekRight(1) === '/') {
        scanner.stream.advance(2);
        offset = scanner.stream.position;
        scanner.state = ScannerState.AfterOpeningEndTag;
        const token = scanner.scan();
        if (token !== TokenType.EndTag) {
          return undefined;
        }
        const tokenText = scanner.getTokenText();
        if (stack.length) {
          const top = stack.pop();
          if (top !== tokenText) {
            console.log(scanner.stream.position);
            console.log(top);
            console.log(tokenText);
            console.error('no');
          }
          continue;
        }
        nextClosingTagName = tokenText;
        if (nextClosingTagName !== undefined) {
          break;
        }
      }

      scanner.stream.advance(1);
      scanner.state = ScannerState.AfterOpeningStartTag;
      const token = scanner.scan();
      if (token !== TokenType.StartTag) {
        // console.log(scanner.getTokenText());
        // console.log("no start tag");
        return undefined;
      }
      const tokenText = scanner.getTokenText();
      if (isSelfClosingTag(tokenText)) {
        scanner.stream.advanceUntilEitherChar(['>'], matchingTagPairs, true);
        scanner.stream.advance(1);
        continue;
      }
      // console.log('here');
      stack.push(tokenText);
      // scanner.stream.advanceUntilEitherChar(['>'], matchingTagPairs, true);
      // scanner.stream.advance(1);
      // offset = scanner.stream.position;
      continue;
    } else {
      if (scanner.stream.peekRight(1) === '') {
        // console.log("end");
        return undefined;
      }
      // don't go outside of comment when inside
      if (scanner.stream.previousChars(2) === '--') {
        // console.log("return undefined");
        return undefined;
      }
      if (scanner.stream.peekLeft(1) === '/') {
        if (stack.length === 0) {
          // console.log("return undefined 2");
          return undefined;
        }
        stack.pop();
        // console.log("pop");
        scanner.stream.advance(1);
        continue;
      }
      // console.log("advance 1");
      scanner.stream.advance(1);
    }
  } while (true);

  return {
    tagName: nextClosingTagName,
    offset,
    seenRightAngleBracket
  };
};

// const text = `<li className="nickname">
//     {nickname}
//     <p
//         className="..."
//         title="..."
//     >
//         <img src="..."/>
//         {sign}
//     </p>
// </li>`;
// getNextClosingTagName(createScanner(text), 5, [], tagName => tagName === "img"); //?
