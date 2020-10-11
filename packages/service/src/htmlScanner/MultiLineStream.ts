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
const quotes = new Set(['`', '"', "'"]);

// const whitespaceSet = new Set([' ', '\n', '\t', '\f', '\r']);
// const isWhitespace: (char: string) => boolean = char => whitespaceSet.has(char);

export class MultiLineStream {
  public position: number;

  private source: string;

  private length: number;
  private matchingTagPairs: readonly [string, string][];
  private nonQuoteMatchingTagPairs: readonly [string, string][];

  constructor(
    source: string,
    position: number,
    matchingTagPairs: readonly [string, string][]
  ) {
    this.source = source;
    this.length = source.length;
    this.position = position;
    this.matchingTagPairs = matchingTagPairs;
    this.nonQuoteMatchingTagPairs = matchingTagPairs.filter(
      (matchingTagPair) => !quotes.has(matchingTagPair[0])
    );
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

  // TODO
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
    const reversedChars = chars.split('').reverse().join('');
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
    skipQuotes: boolean,
    isReact: boolean
  ): boolean {
    const specialCharSet = new Set([...(isReact ? ['{', '}'] : [])]);
    while (this.position >= 0) {
      if (isReact) {
        if (specialCharSet.has(this.source[this.position])) {
          if (this.source[this.position] === '{') {
            return false;
          }
          if (this.source[this.position] === '}') {
            let stackSize = 1;
            while (--this.position > 0) {
              if (this.source[this.position] === '}') {
                stackSize++;
              } else if (this.source[this.position] === '{') {
                stackSize--;
                if (stackSize === 0) {
                  break;
                }
              }
            }
          }
        }
      }
      // don't go outside of matching tag pairs, e.g. don't go before `<!--` in `<!-- <but|ton> -->`
      outerForLoop1: for (const matchingTagPair of this
        .nonQuoteMatchingTagPairs) {
        for (let j = 0; j < matchingTagPair[0].length; j++) {
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
      outerForLoop2: for (const matchingTagPair of this.matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[1].length; i++) {
          if (
            matchingTagPair[1][matchingTagPair[1].length - 1 - i] !==
            this.source[this.position - i]
          ) {
            continue outerForLoop2;
          }
        }
        if (quotes.has(matchingTagPair[0])) {
          if (!skipQuotes) {
            this.goBack(1);
            return this.goBackUntilEitherChar(chars, skipQuotes, isReact);
          }
        }
        this.goBack(matchingTagPair[1].length); // e.g. go before `-->`
        this.goBackToUntilChars(matchingTagPair[0]); // e.g. go back until `<!--`
        this.goBack(matchingTagPair[0].length + 1); // e.g. go before `<!--`
        return this.goBackUntilEitherChar(chars, skipQuotes, isReact);
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
    skipQuotes: boolean,
    isReact: boolean
  ): boolean {
    const specialCharSet = new Set([
      ...chars,
      ...this.matchingTagPairs.map((x) => x[1][0]),
      ...this.matchingTagPairs.map((x) => x[0][0]),
      ...(isReact ? ['{', '}'] : []),
    ]);
    while (this.position < this.source.length) {
      if (!specialCharSet.has(this.source[this.position])) {
        this.position++;
        continue;
      }
      if (isReact) {
        if (this.source[this.position] === '{') {
          let stackSize = 1;
          while (++this.position < this.source.length) {
            if (this.source[this.position] === '{') {
              stackSize++;
            } else if (this.source[this.position] === '}') {
              stackSize--;
              if (stackSize === 0) {
                this.position++;
                break;
              }
            }
          }
        } else if (this.source[this.position] === '}') {
          return false;
        }
      }
      // don't go outside of matching tag pair, e.g. don't go past `-->` in `<!-- <but|ton> -->`
      outerForLoop1: for (const matchingTagPair of this
        .nonQuoteMatchingTagPairs) {
        for (let j = 0; j < matchingTagPair[1].length; j++) {
          if (matchingTagPair[1][j] !== this.source[this.position + j]) {
            continue outerForLoop1;
          }
        }
        return false;
      }

      // skip matching tag pairs, e.g. skip '<!-- </button> -->' in '<button><!-- </button> --></button>'
      outerForLoop2: for (const matchingTagPair of this.matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[0].length; i++) {
          if (matchingTagPair[0][i] !== this.source[this.position + i]) {
            continue outerForLoop2;
          }
        }
        if (quotes.has(matchingTagPair[0])) {
          if (!skipQuotes) {
            this.advance(1);
            return this.advanceUntilEitherChar(chars, skipQuotes, isReact);
          }
        }
        this.advance(matchingTagPair[0].length); // e.g. advance until after `<!--`
        this.advanceUntilChars(matchingTagPair[1]); // e.g. advance until `-->`
        this.advance(matchingTagPair[1].length); // e.g. advance until after `-->`
        return this.advanceUntilEitherChar(chars, skipQuotes, isReact);
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
