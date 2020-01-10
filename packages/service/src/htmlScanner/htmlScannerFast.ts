/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable sonarjs/no-all-duplicated-branches */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MultiLineStream } from './MultiLineStream';

// const elementsWithEmbeddedContentMap = {
//   style: true,
//   script: true,
// }
// TODO
// function isElementWithEmbeddedContent(tagName: string): boolean {
//   return elementsWithEmbeddedContentMap[tagName]
// }

const quoteMap = {
  "'": true,
  '"': true
};

function isQuote(char: string): boolean {
  return char in quoteMap;
}

/**
 * HTML tag name (explaining the regex)
 *
 * This regex is for the name of the html tag
 * E.g. we want to match "div" inside "<div>"
 *
 * ^  ### start
 * [:\w]  ### ":" or character or digit
 * ((?![>\/])[\S])  ### everything except closing brackets
 */
const htmlTagNameRE = /^[!:\w]((?![>\/])[\S])*/;

/**
 * Empty html tag, e.g. `< ></>`
 */
const htmlTagNameEmptyRE = /^\s+/;

/**
 * Html attribute name (explaining the regex)
 *
 * This regex is for html attribute names,
 * E.g. we want to match "class" in "<div class="center">"
 *
 * ^  ### start
 *   [^\s"'>/=]*  ### any anything that isn't whitespace, ", ', >, / or =
 */
const htmlAttributeNameRE = /^[^\s"'>/=]*/;

/**
 * Html attribute value (explaining the regex)
 *
 * ^  ### start
 *   [^\s"'`=<>/]+  ### no whitespace, quotes, "=", "<", ">" and "/"
 */
const htmlAttributeValueRE = /^[^\s"'`=<>/]+/;

export const enum TokenTypeFast {
  StartCommentTag, // "<--" part of "<!-- this is a comment -->"
  Comment, // " this is a comment " part of "<!-- this is a comment -->"
  EndCommentTag, // "-->" part of "<!-- this is a comment -->"
  StartTagOpen, // "<" part of "<html>"
  StartTagClose, // ">" part of "<html>"
  StartTagSelfClose, // "/>" part of "<input />"
  StartTag, // "input" part of "<input>"
  EndTagOpen, // "<" part of "</html>"
  EndTagClose, // ">" part of "</html>"
  EndTag, // "html" part of </html>
  AttributeName, // "class" part of "<div class="center">"
  AttributeValue, // "center" part of "<div class="center">"
  Content, // "this is text" part of "<p>this is text</p>"
  EOS, // end of stream
  DelimiterAssign, // "=" part of "<div class="center">
  Unknown, // anything that doesn't make sense, e.g. ";" in "i <length;"
  WhiteSpace
}

export interface ScannerFast {
  readonly scan: () => TokenTypeFast;
  readonly getTokenOffset: () => number;
  readonly getTokenText: () => string;
  readonly getTokenEnd: () => number;
  readonly stream: MultiLineStream;
  state: ScannerStateFast;
}

export const enum ScannerStateFast {
  WithinContent,
  AfterOpeningStartTag,
  AfterOpeningEndTag,
  WithinStartTag,
  WithinEndTag,
  WithinComment,
  AfterAttributeName,
  BeforeAttributeValue
}

export function createScannerFast({
  input,
  initialOffset,
  initialState,
  embeddedContentTags
}: {
  input: string;
  initialOffset: number;
  initialState: ScannerStateFast;
  embeddedContentTags: string[];
}): ScannerFast {
  const stream = new MultiLineStream(input, initialOffset);
  let state: ScannerStateFast = initialState;
  let tokenOffset: number;
  /**
   * Whether or not a space is after the starting tag name.
   * E.g. "<div >" but not "<div''>" and "<div class="center" >" but not "<div class="center">""
   * This is used to determine whether the following characters are attributes or just invalid
   */
  let hasSpaceAfterStartingTagName: boolean;
  let embeddedContent: boolean;

  function nextElementName(): string | undefined {
    let result = stream.advanceIfRegExp(htmlTagNameRE);
    if (result === undefined) {
      if (stream.advanceIfRegExp(htmlTagNameEmptyRE)) {
        result = '';
      }
    }
    return result;
  }

  function nextAttributeName(): string {
    return stream.advanceIfRegExp(htmlAttributeNameRE)!;
  }

  function nextUnquotedAttributeValue(): string {
    return stream.advanceIfRegExp(htmlAttributeValueRE)!;
  }

  let lastTagName: string | undefined;
  // eslint-disable-next-line consistent-return
  // @ts-ignore
  function scan(): TokenTypeFast {
    tokenOffset = stream.position;
    let lastAttributeName: string;
    if (stream.eos()) {
      return TokenTypeFast.EOS;
    }
    switch (state) {
      case ScannerStateFast.WithinComment:
        if (stream.advanceIfChars('-->')) {
          state = ScannerStateFast.WithinContent;
          return TokenTypeFast.EndCommentTag;
        }
        stream.advanceUntilChars('-->');
        return TokenTypeFast.Comment;
      case ScannerStateFast.WithinContent:
        if (stream.advanceIfChars('</')) {
          state = ScannerStateFast.AfterOpeningEndTag;
          return TokenTypeFast.EndTagOpen;
        }
        if (embeddedContent) {
          stream.advanceUntilChars(`</${lastTagName}`);
          return TokenTypeFast.Content;
        }
        if (stream.advanceIfChars('<!--')) {
          state = ScannerStateFast.WithinComment;
          return TokenTypeFast.StartCommentTag;
        }
        if (stream.advanceIfChars('<')) {
          state = ScannerStateFast.AfterOpeningStartTag;
          return TokenTypeFast.StartTagOpen;
        }
        stream.advanceUntilChar('<');
        return TokenTypeFast.Content;
      case ScannerStateFast.AfterOpeningEndTag:
        const tagName = nextElementName();
        if (tagName) {
          state = ScannerStateFast.WithinEndTag;
          return TokenTypeFast.EndTag;
        } else if (stream.peekRight(0) === '>') {
          state = ScannerStateFast.WithinEndTag;
          return TokenTypeFast.EndTag;
        }
        return TokenTypeFast.Unknown;
      case ScannerStateFast.WithinEndTag:
        if (stream.skipWhitespace()) {
          tokenOffset = stream.position;
        }
        if (stream.advanceIfChar('>')) {
          state = ScannerStateFast.WithinContent;
          embeddedContent = false;
          return TokenTypeFast.EndTagClose;
        }
        // error at this point
        console.error('error 2');
        break;
      case ScannerStateFast.AfterOpeningStartTag:
        lastTagName = nextElementName();
        if (lastTagName !== undefined) {
          if (lastTagName === '') {
            tokenOffset = stream.position;
          } else if (embeddedContentTags.includes(lastTagName)) {
            embeddedContent = true;
          }
          state = ScannerStateFast.WithinStartTag;
          return TokenTypeFast.StartTag;
        }
        // this is a tag like "<>"
        if (stream.peekRight() === '>') {
          state = ScannerStateFast.WithinStartTag;
          return TokenTypeFast.StartTag;
        }
        // At this point there is no tag name sign after the opening tag "<"
        // E.g. "< div"
        // So we just assume that it is text
        state = ScannerStateFast.WithinContent;
        return scan();
      case ScannerStateFast.WithinStartTag:
        if (stream.skipWhitespace()) {
          tokenOffset = stream.position;
          hasSpaceAfterStartingTagName = true;
        }
        if (hasSpaceAfterStartingTagName) {
          lastAttributeName = nextAttributeName();
          if (lastAttributeName) {
            state = ScannerStateFast.AfterAttributeName;
            hasSpaceAfterStartingTagName = false;
            return TokenTypeFast.AttributeName;
          }
        }
        if (stream.advanceIfChars('/>')) {
          state = ScannerStateFast.WithinContent;
          return TokenTypeFast.StartTagSelfClose;
        }
        if (stream.advanceIfChars('>')) {
          state = ScannerStateFast.WithinContent;
          return TokenTypeFast.StartTagClose;
        }
        // At this point there is space and no closing tag
        // E.g. "<div;"
        stream.advance(1);
        return TokenTypeFast.Unknown;
      case ScannerStateFast.AfterAttributeName:
        if (stream.skipWhitespace()) {
          tokenOffset = stream.position;
          hasSpaceAfterStartingTagName = true;
        }
        if (stream.advanceIfChar('=')) {
          state = ScannerStateFast.BeforeAttributeValue;
          return TokenTypeFast.DelimiterAssign;
        }
        // At this point there is no equal sign after an attribute
        // E.g. "<div class>"
        // So we just assume that we are still inside the tag
        state = ScannerStateFast.WithinStartTag;
        return scan();
      case ScannerStateFast.BeforeAttributeValue:
        if (stream.skipWhitespace()) {
          tokenOffset = stream.position;
        }
        // no quotes around attribute e.g. "<div class=center>"
        const unquotedAttributeValue = nextUnquotedAttributeValue();
        if (unquotedAttributeValue) {
          state = ScannerStateFast.WithinStartTag;
          return TokenTypeFast.AttributeValue;
        }
        // single quote or double quote around attribute value, e.g. "<div class="center">"
        const char = stream.peekRight();
        if (isQuote(char)) {
          stream.advance(1); // consume opening quote
          if (stream.advanceUntilChar(char)) {
            stream.advance(1); // consume closing quote
          }
          state = ScannerStateFast.WithinStartTag;
          return TokenTypeFast.AttributeValue;
        }

        // TODO error
        state = ScannerStateFast.WithinStartTag;
        return scan();

      default:
        break;
    }
  }

  return {
    scan,
    stream,
    getTokenOffset() {
      return tokenOffset;
    },
    getTokenText() {
      return stream.getSource().slice(tokenOffset, stream.position);
    },
    getTokenEnd() {
      return stream.position;
    },
    get state() {
      return state;
    },
    set state(newState) {
      state = newState;
    }
  };
}
