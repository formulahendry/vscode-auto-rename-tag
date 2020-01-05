import {
  createScanner,
  Scanner,
  ScannerState,
  TokenType
} from "../htmlScanner/htmlScanner";

export const getPreviousOpeningTagName: (
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
  let offset = initialOffset + 1;
  let parentTagName: string | undefined;
  let stack: string[] = [];
  let seenRightAngleBracket = false;
  let selfClosing = false;
  let i = 0;
  outer: do {
    scanner.stream.goTo(offset - 2);
    const hasFoundChar = scanner.stream.goBackUntilEitherChar(
      ["<", ">"],
      matchingTagPairs
    );
    if (!hasFoundChar) {
      return undefined;
    }
    const char = scanner.stream.peekLeft(1);
    if (!["<", ">"].includes(char)) {
      return undefined;
    }
    if (char === ">") {
      if (scanner.stream.peekLeft(2) === "/") {
        selfClosing = true;
      }
      seenRightAngleBracket = true;
      scanner.stream.goBack(1);
      scanner.stream.goBackUntilEitherChar(["<"], matchingTagPairs);
      offset = scanner.stream.position;
    }
    if (char === "<") {
      seenRightAngleBracket;
    }
    // push closing tags onto the stack
    if (scanner.stream.peekRight() === "/") {
      offset = scanner.stream.position - 1;
      scanner.stream.advance(1);
      scanner.state = ScannerState.AfterOpeningEndTag;
      scanner.scan();
      const token = scanner.getTokenText();
      if (token === "") {
        offset = scanner.stream.position - 1;
        continue;
      }
      // console.log('push' + scanner.getTokenText())
      stack.push(scanner.getTokenText());
      continue;
    }
    offset = scanner.stream.position;
    scanner.state = ScannerState.AfterOpeningStartTag;
    // scanner.stream.advance(1)
    const token = scanner.scan();
    // if (!seenRightAngleBracket) {
    //   console.log('no see')
    // }
    if (token !== TokenType.StartTag) {
      return undefined;
    }
    const tokenText = scanner.getTokenText();
    // if (isSelfClosingTag(tokenText)) {
    //   continue
    // }
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
// const text = `<button> {/* </button> */}</buttonn>`
// getPreviousOpeningTagName(createScanner(text), 25, [['/*', '*/']]) //?

// const text = `<button></buttonn>`
// getPreviousOpeningTagName(createScanner(text), 8, [['/*', '*/']]) //?

// const text = `<button>   </buttonn>`

// getPreviousOpeningTagName(createScanner(text), 10, [['/*', '*/']]) //?

// const text = `<button>{/* <button> */}</buttonn>`
// getPreviousOpeningTagName(createScanner(text), 24, [['/*', '*/']]) //?

// const text = `<div><!-- </div> --> </dddddddd>`
// getPreviousOpeningTagName(createScanner(text), 20, [['<!--', '-->']]) //?

// const text = `<a></b>`
// getPreviousOpeningTagName(createScanner(text), 3, [['<!--', '-->']]) //?
// const text = `<head>
//   <link>
// </headd>`
// getPreviousOpeningTagName(createScanner(text), 15, 'html') //?
// const text = `<head><link></headd>`
// getPreviousOpeningTagName(createScanner(text), 12, 'html') //?

const text = `<span title="<span>">
</span>`;

getPreviousOpeningTagName(
  createScanner(text),
  21,
  [
    ["'", "'"],
    ['"', '"']
  ],
  () => false
); //?
