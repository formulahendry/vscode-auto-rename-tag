import { MultiLineStream } from './MultiLineStream';

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
const htmlTagNameRE = /^[!:\w\$]((?![>\/])[\S])*/;

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
 *   [^\s"'`=<>/]+  ### no whitespace, double quotes, single quotes, back quotes, "=", "<", ">" and "/"
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
  WhiteSpace,
}

export interface ScannerFast {
  readonly scan: () => TokenTypeFast;
  readonly getTokenText: () => string;
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
  BeforeAttributeValue,
}

export function createScannerFast({
  input,
  initialOffset,
  initialState,
  matchingTagPairs,
}: {
  input: string;
  initialOffset: number;
  initialState: ScannerStateFast;
  matchingTagPairs: readonly [string, string][];
}): ScannerFast {
  const stream = new MultiLineStream(input, initialOffset, matchingTagPairs);
  let state: ScannerStateFast = initialState;
  let tokenOffset: number;
  /**
   * Whether or not a space is after the starting tag name.
   * E.g. "<div >" but not "<div''>" and "<div class="center" >" but not "<div class="center">""
   * This is used to determine whether the following characters are attributes or just invalid
   */

  function nextElementName(): string | undefined {
    let result = stream.advanceIfRegExp(htmlTagNameRE);
    if (result === undefined) {
      if (stream.advanceIfRegExp(htmlTagNameEmptyRE)) {
        result = '';
      }
    }
    return result;
  }

  let lastTagName: string | undefined;
  // @ts-ignore
  function scan(): TokenTypeFast {
    tokenOffset = stream.position;
    if (stream.eos()) {
      return TokenTypeFast.EOS;
    }
    switch (state) {
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

      case ScannerStateFast.AfterOpeningStartTag:
        lastTagName = nextElementName();
        if (lastTagName !== undefined) {
          if (lastTagName === '') {
            tokenOffset = stream.position;
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
      default:
        break;
    }
  }

  return {
    scan,
    stream,
    getTokenText() {
      return stream.getSource().slice(tokenOffset, stream.position);
    },
    set state(newState: any) {
      state = newState;
    },
  };
}
