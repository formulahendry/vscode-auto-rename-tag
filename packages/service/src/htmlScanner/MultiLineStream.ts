/**
 * For these chars code can be ambiguous, e.g.
 * `<div class="<button class="></div>"</button>`
 * Here, the button start tag can be interpreted as a class
 * or the closing div tag can be interpreted as a class.
 * In case of quotes we always skip.
 *
 * This is in contrast to chars that cannot be skipped, e.g. when
 * going forward and encountering `-->` we cannot go further
 * because we would go outside of the comment but when going
 * forward and encountering `"` we can go forward until
 * the next quote.
 *
 */
const matchingTagPairsThatPreferSkip = ['`', '"', "'", '{'];

const whitespaceSet = new Set([' ', '\n', '\t', '\f', '\r']);
const isWhitespace: (char: string) => boolean = char => whitespaceSet.has(char);

export class MultiLineStream {
  public position: number;

  private source: string;

  private length: number;

  constructor(source: string, position: number) {
    this.source = source;
    this.length = source.length;
    this.position = position;
  }

  public eos(): boolean {
    return this.length <= this.position;
  }

  public getSource(): string {
    return this.source;
  }

  public goTo(position: number): void {
    this.position = position;
  }

  public goBack(n: number): void {
    this.position -= n;
  }

  public advance(n: number): void {
    this.position += n;
  }

  private goToEnd(): void {
    this.position = this.source.length;
  }

  // public raceBackUntilChars(firstChar: string, secondChar: string): string {
  //   this.position--;
  //   while (
  //     this.position >= 0 &&
  //     this.source[this.position] !== firstChar &&
  //     this.source[this.position] !== secondChar
  //   ) {
  //     this.position--;
  //   }
  //   this.position++;
  //   if (this.position === 0) {
  //     return '';
  //   }
  //   return this.source[this.position - 1];
  // }

  private goBackToUntilChars(chars: string): void {
    const reversedChars = chars
      .split('')
      .reverse()
      .join('');
    outer: while (this.position >= 0) {
      for (let i = 0; i < reversedChars.length; i++) {
        if (this.source[this.position - i] !== reversedChars[i]) {
          this.position--;
          continue outer;
        }
      }
      break;
    }
    this.position++;
  }

  public goBackUntilEitherChar(
    chars: string[],
    matchingTagPairs: readonly [string, string][],
    skipQuotes: boolean
  ): boolean {
    while (this.position >= 0) {
      // don't go outside of matching tag pairs, e.g. don't go before `<!--` in `<!-- <but|ton> -->`
      outerForLoop1: for (const matchingTagPair of matchingTagPairs) {
        for (let j = 0; j < matchingTagPair[0].length; j++) {
          if (
            matchingTagPair[0] === matchingTagPair[1] &&
            matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])
          ) {
            continue outerForLoop1;
          }
          if (
            matchingTagPair[0][matchingTagPair[0].length - 1 - j] !==
            this.source[this.position - j]
          ) {
            continue outerForLoop1;
          }
        }
        return false;
      }
      // skip matching tag pairs, e.g. skip '<!-- </button> -->' in '<button><!-- </button> --></button>'
      outerForLoop2: for (const matchingTagPair of matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[1].length; i++) {
          if (
            matchingTagPair[1][matchingTagPair[1].length - 1 - i] !==
            this.source[this.position - i]
          ) {
            continue outerForLoop2;
          }
        }
        if (matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])) {
          if (!skipQuotes) {
            this.goBack(1);
            return this.goBackUntilEitherChar(
              chars,
              matchingTagPairs,
              skipQuotes
            );
          }
        }
        this.goBack(matchingTagPair[1].length); // e.g. go before `-->`
        this.goBackToUntilChars(matchingTagPair[0]); // e.g. go back until `<!--`
        this.goBack(matchingTagPair[0].length + 1); // e.g. go before `<!--`
        return this.goBackUntilEitherChar(chars, matchingTagPairs, skipQuotes);
      }
      if (chars.includes(this.source[this.position])) {
        this.position++;
        return true;
      }
      this.position--;
    }
    return false;
  }
  public advanceUntilEitherChar(
    chars: string[],
    matchingTagPairs: readonly [string, string][],
    skipQuotes: boolean
  ): boolean {
    while (this.position < this.source.length) {
      // don't go outside of matching tag pair, e.g. don't go past `-->` in `<!-- <but|ton> -->`
      outerForLoop1: for (const matchingTagPair of matchingTagPairs) {
        for (let j = 0; j < matchingTagPair[1].length; j++) {
          if (
            matchingTagPair[0] === matchingTagPair[1] &&
            matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])
          ) {
            continue outerForLoop1;
          }
          if (matchingTagPair[1][j] !== this.source[this.position + j]) {
            continue outerForLoop1;
          }
        }
        return false;
      }

      // skip matching tag pairs, e.g. skip '<!-- </button> -->' in '<button><!-- </button> --></button>'
      outerForLoop2: for (const matchingTagPair of matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[0].length; i++) {
          if (matchingTagPair[0][i] !== this.source[this.position + i]) {
            continue outerForLoop2;
          }
        }
        if (matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])) {
          if (!skipQuotes) {
            // if (this.source[this.position - 1] === '>') {
            //   return false;
            // }
            this.advance(1);
            return this.advanceUntilEitherChar(
              chars,
              matchingTagPairs,
              skipQuotes
            );
          }
        }
        this.advance(matchingTagPair[0].length); // e.g. advance until after `<!--`
        this.advanceUntilChars(matchingTagPair[1]); // e.g. advance until `-->`
        this.advance(matchingTagPair[1].length); // e.g. advance until after `-->`
        return this.advanceUntilEitherChar(chars, matchingTagPairs, skipQuotes);
      }
      if (chars.includes(this.source[this.position])) {
        return true;
      }
      this.position++;
    }
    return false;
  }

  public peekLeft(n: number = 0): string {
    return this.source[this.position - n];
  }

  public previousChars(n: number): string {
    return this.source.slice(this.position - n, this.position);
  }

  public peekRight(n: number = 0): string {
    return this.source[this.position + n] || '';
  }

  public advanceIfRegExp(regex: RegExp): string | undefined {
    const str = this.source.substr(this.position);
    const match = str.match(regex);
    if (match) {
      this.position = this.position + match.index! + match[0].length;
      return match[0];
    }
    return undefined;
  }

  private advanceUntilChars(ch: string): boolean {
    while (this.position + ch.length <= this.source.length) {
      let i = 0;
      while (i < ch.length && this.source[this.position + i] === ch[i]) {
        i++;
      }
      if (i === ch.length) {
        return true;
      }
      this.advance(1);
    }
    this.goToEnd();
    return false;
  }
}
