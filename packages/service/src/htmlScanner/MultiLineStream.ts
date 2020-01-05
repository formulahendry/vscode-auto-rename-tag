const whitespaceMap = {
  ' ': true,
  '\n': true,
  '\t': true,
  '\f': true,
  '\r': true,
}

function isWhitespace(char: string): boolean {
  return char in whitespaceMap
}

export class MultiLineStream {
  public position: number

  private source: string

  private length: number

  constructor(source: string, position: number) {
    this.source = source
    this.length = source.length
    this.position = position
  }

  public eos(): boolean {
    return this.length <= this.position
  }

  public getSource(): string {
    return this.source
  }

  public goTo(position: number): void {
    this.position = position
  }

  public goBack(n: number): void {
    this.position -= n
  }

  public goBackWhileRegex(regex: RegExp): void {
    let char
    this.position++
    do {
      this.position--
      char = this.source[this.position]
    } while (regex.test(char) && this.position > 0)
    this.position++
  }

  public advance(n: number): void {
    this.position += n
  }

  public goToEnd(): void {
    this.position = this.source.length
  }

  public raceBackUntilChars(firstChar: string, secondChar: string): string {
    this.position--
    while (
      this.position >= 0 &&
      this.source[this.position] !== firstChar &&
      this.source[this.position] !== secondChar
    ) {
      this.position--
    }
    this.position++
    if (this.position === 0) {
      return ''
    }
    return this.source[this.position - 1]
  }

  public goBackToUntilChar(char: string): void {
    while (this.position >= 0 && this.source[this.position] !== char) {
      this.position--
    }
    this.position++
  }
  public goBackToUntilChars(chars: string): void {
    const reversedChars = chars
      .split('')
      .reverse()
      .join('')
    outer: while (this.position >= 0) {
      for (let i = 0; i < reversedChars.length; i++) {
        if (this.source[this.position - i] !== reversedChars[i]) {
          this.position--
          continue outer
        }
      }
      break
    }
    this.position++
  }

  public goBackUntilEitherChar(
    chars: string[],
    matchingTagPairs: readonly [string, string][]
  ): boolean {
    /**
     * For these chars code can be ambiguous, e.g.
     * <div class="<button class="></div>"</button>
     * Here, the button start tag can be interpreted as a class
     * or the closing div tag can be interpreted as a class
     * in this case we always assume that the quote we encounter
     * is a opening quote
     * TODO separate between matching tag pairs in attributes vs between tags
     */
    const matchingTagPairsThatPreferSkip = ['"', "'"]
    while (this.position > 0) {
      // don't go outside of matching tag pair, e.g. don't go before '<!--' in '<!-- <but|ton> --> '
      outerForLoop1: for (const matchingTagPair of matchingTagPairs) {
        for (let j = 0; j < matchingTagPair[0].length; j++) {
          if (
            matchingTagPair[0] === matchingTagPair[1] &&
            matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])
          ) {
            continue outerForLoop1
          }
          if (
            matchingTagPair[0][matchingTagPair[0].length - 1 - j] !==
            this.source[this.position - j]
          ) {
            continue outerForLoop1
          }
        }
        return false
      }
      // skip matching tag pairs, e.g. skip '<!-- </button> -->' in '<button><!-- </button> --></button>'
      outerForLoop2: for (const matchingTagPair of matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[1].length; i++) {
          if (
            matchingTagPair[1][matchingTagPair[1].length - 1 - i] !==
            this.source[this.position - i]
          ) {
            continue outerForLoop2
          }
        }
        this.goBackToUntilChars(matchingTagPair[0])
        this.goBack(matchingTagPair[0].length + 1)
        return this.goBackUntilEitherChar(chars, matchingTagPairs)
      }
      if (chars.includes(this.source[this.position])) {
        this.position++
        return true
      }
      this.position--
    }
    return false
  }
  public advanceUntilEitherChar(
    chars: string[],
    matchingTagPairs: readonly [string, string][]
  ): boolean {
    /**
     * For these chars code can be ambiguous, e.g.
     * <div class="<button class="></div>"</button>
     * Here, the button start tag can be interpreted as a class
     * or the closing div tag can be interpreted as a class
     * in this case we always assume that the quote we encounter
     * is a opening quote
     * TODO separate between matching tag pairs in attributes vs between tags
     */
    const matchingTagPairsThatPreferSkip = ['"', "'"]
    while (this.position < this.source.length) {
      // don't go outside of matching tag pair, e.g. don't go past '-->' in '<!-- <but|ton> --> '
      outerForLoop1: for (const matchingTagPair of matchingTagPairs) {
        for (let j = 0; j < matchingTagPair[1].length; j++) {
          if (
            matchingTagPair[0] === matchingTagPair[1] &&
            matchingTagPairsThatPreferSkip.includes(matchingTagPair[0])
          ) {
            continue outerForLoop1
          }
          if (matchingTagPair[1][j] !== this.source[this.position + j]) {
            continue outerForLoop1
          }
        }
        return false
      }

      // skip matching tag pairs, e.g. skip '<!-- </button> -->' in '<button><!-- </button> --></button>'
      outerForLoop2: for (const matchingTagPair of matchingTagPairs) {
        for (let i = 0; i < matchingTagPair[0].length; i++) {
          if (matchingTagPair[0][i] !== this.source[this.position + i]) {
            continue outerForLoop2
          }
        }
        this.advanceUntilChars(matchingTagPair[1])
        this.advance(matchingTagPair[1].length)
        return this.advanceUntilEitherChar(chars, matchingTagPairs)
      }
      if (chars.includes(this.source[this.position])) {
        return true
      }
      this.position++
    }
    return false
  }

  public peekLeft(n: number = 0): string {
    return this.source[this.position - n]
  }

  public currentlyEndsWith(chars: string): boolean {
    for (let i = 0; i < chars.length; i++) {
      if (this.source[this.position - i - 1] !== chars[chars.length - 1 - i]) {
        return false
      }
    }
    return true
  }

  public currentlyEndsWithRegex(regex: RegExp): boolean {
    return regex.test(this.source.slice(0, this.position))
  }

  public previousChar(): string {
    return this.source[this.position]
  }
  public previousChars(n: number): string {
    return this.source.slice(this.position - n, this.position)
  }

  public nextChar(): string {
    return this.source[this.position + 1]
  }

  public nextChars(n: number): string {
    return this.source.slice(this.position, this.position + n)
  }

  public peekRight(n: number = 0): string {
    return this.source[this.position + n] || ''
  }

  public advanceIfChar(ch: string): boolean {
    if (ch === this.source[this.position]) {
      this.position++
      return true
    }
    return false
  }

  public advanceIfChars(ch: string): boolean {
    if (this.position + ch.length > this.source.length) {
      return false
    }
    for (let i = 0; i < ch.length; i++) {
      if (this.source[this.position + i] !== ch[i]) {
        return false
      }
    }
    this.advance(ch.length)
    return true
  }

  public advanceIfRegExp(regex: RegExp): string | undefined {
    const str = this.source.substr(this.position)
    const match = str.match(regex)
    if (match) {
      this.position = this.position + match.index! + match[0].length
      return match[0]
    }
    return undefined
  }

  public advanceUntilRegExp(regex: RegExp): string | undefined {
    const str = this.source.substr(this.position)
    const match = str.match(regex)
    if (match) {
      this.position = this.position + match.index!
      return match[0]
    }
    this.goToEnd()

    return undefined
  }

  public advanceUntilChar(ch: string): boolean {
    while (this.position < this.source.length) {
      if (this.source[this.position] === ch) {
        return true
      }
      this.advance(1)
    }
    return false
  }

  public advanceUntilChars(ch: string): boolean {
    while (this.position + ch.length <= this.source.length) {
      let i = 0
      while (i < ch.length && this.source[this.position + i] === ch[i]) {
        i++
      }
      if (i === ch.length) {
        return true
      }
      this.advance(1)
    }
    this.goToEnd()
    return false
  }

  public skipWhitespace(): boolean {
    const initialPosition = this.position
    while (
      this.position < this.length &&
      isWhitespace(this.source[this.position])
    ) {
      this.position++
    }
    return this.position - initialPosition > 0
  }
}
