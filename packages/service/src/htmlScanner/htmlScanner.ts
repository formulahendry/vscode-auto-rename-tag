import {
  ScannerStateFast,
  ScannerFast,
  createScannerFast,
  TokenTypeFast,
} from './htmlScannerFast'

export enum ScannerState {
  WithinContent = 'within-content',
  AfterOpeningStartTag = 'after-opening-start-tag',
  AfterOpeningEndTag = 'after-opening-end-tag',
  WithinStartTag = 'within-start-tag',
  WithinEndTag = 'within-end-tag',
  WithinComment = 'within-comment',
  AfterAttributeName = 'after-attribute-name',
  BeforeAttributeValue = 'before-attribute-name',
}

export enum TokenType {
  StartCommentTag = 'start-comment-tag',
  Comment = 'comment',
  EndCommentTag = 'end-comment-tag',
  StartTagOpen = 'start-tag-open',
  StartTagClose = 'start-tag-close',
  StartTagSelfClose = 'start-tag-self-close',
  StartTag = 'start-tag',
  EndTagOpen = 'end-tag-open',
  EndTagClose = 'end-tag-close',
  EndTag = 'end-tag',
  AttributeName = 'attribute-name',
  AttributeValue = 'attribute-value',
  Content = 'content',
  EOS = 'eos',
  DelimiterAssign = 'delimiter-assign',
  WhiteSpace = 'whitespace',
  Unknown = 'unknown',
}

export type Scanner = Omit<ScannerFast, 'scan' | 'state'> & {
  scan: () => TokenType
  state: ScannerState
}
export function toScannerState(
  scannerStateReadable: ScannerState
): ScannerStateFast {
  switch (scannerStateReadable) {
    case ScannerState.AfterAttributeName:
      return ScannerStateFast.AfterAttributeName
    case ScannerState.AfterOpeningEndTag:
      return ScannerStateFast.AfterOpeningEndTag
    case ScannerState.AfterOpeningStartTag:
      return ScannerStateFast.AfterOpeningStartTag
    case ScannerState.BeforeAttributeValue:
      return ScannerStateFast.BeforeAttributeValue
    case ScannerState.WithinComment:
      return ScannerStateFast.WithinComment
    case ScannerState.WithinContent:
      return ScannerStateFast.WithinContent
    case ScannerState.WithinEndTag:
      return ScannerStateFast.WithinEndTag
    case ScannerState.WithinStartTag:
      return ScannerStateFast.WithinStartTag
    default:
      throw new Error(`unknown scannerState ${scannerStateReadable}`)
  }
}

export function toScannerStateReadable(
  scannerState: ScannerStateFast
): ScannerState {
  switch (scannerState) {
    case ScannerStateFast.AfterAttributeName:
      return ScannerState.AfterAttributeName
    case ScannerStateFast.AfterOpeningEndTag:
      return ScannerState.AfterOpeningEndTag
    case ScannerStateFast.AfterOpeningStartTag:
      return ScannerState.AfterOpeningStartTag
    case ScannerStateFast.BeforeAttributeValue:
      return ScannerState.BeforeAttributeValue
    case ScannerStateFast.WithinComment:
      return ScannerState.WithinComment
    case ScannerStateFast.WithinContent:
      return ScannerState.WithinContent
    case ScannerStateFast.WithinEndTag:
      return ScannerState.WithinEndTag
    case ScannerStateFast.WithinStartTag:
      return ScannerState.WithinStartTag
    default:
      throw new Error(`unknown scannerState ${scannerState}`)
  }
}

export function toTokenTypeReadable(tokenType: TokenTypeFast): TokenType {
  switch (tokenType) {
    case TokenTypeFast.AttributeName:
      return TokenType.AttributeName
    case TokenTypeFast.Unknown:
      return TokenType.Unknown
    case TokenTypeFast.AttributeValue:
      return TokenType.AttributeValue
    case TokenTypeFast.Comment:
      return TokenType.Comment
    case TokenTypeFast.EOS:
      return TokenType.EOS
    case TokenTypeFast.Content:
      return TokenType.Content
    case TokenTypeFast.EndCommentTag:
      return TokenType.EndCommentTag
    case TokenTypeFast.EndTag:
      return TokenType.EndTag
    case TokenTypeFast.EndTagClose:
      return TokenType.EndTagClose
    case TokenTypeFast.EndTagOpen:
      return TokenType.EndTagOpen
    case TokenTypeFast.StartCommentTag:
      return TokenType.StartCommentTag
    case TokenTypeFast.StartTag:
      return TokenType.StartTag
    case TokenTypeFast.StartTagClose:
      return TokenType.StartTagClose
    case TokenTypeFast.StartTagOpen:
      return TokenType.StartTagOpen
    case TokenTypeFast.StartTagSelfClose:
      return TokenType.StartTagSelfClose
    case TokenTypeFast.DelimiterAssign:
      return TokenType.DelimiterAssign
    case TokenTypeFast.WhiteSpace:
      return TokenType.WhiteSpace
    case undefined:
      return undefined!
    default:
      throw new Error(`unknown tokenType "${tokenType}"`)
  }
}

export function createScanner(
  input: string,
  {
    initialOffset = 0,
    scannerState = ScannerState.WithinContent,
    embeddedContentTags = ['script', 'style'],
  }: {
    initialOffset?: number
    scannerState?: ScannerState
    embeddedContentTags?: string[]
  } = {}
): Scanner {
  const scanner = createScannerFast({
    input,
    initialOffset,
    initialState: toScannerState(scannerState),
    embeddedContentTags,
  })
  return {
    ...scanner,
    scan() {
      return toTokenTypeReadable(scanner.scan())
    },
    set state(newState) {
      scanner.state = toScannerState(newState)
    },
    get state() {
      return toScannerStateReadable(scanner.state)
    },
  }
}

const scanner = createScanner('<style/>css<style/>') // ?

scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
scanner.scan() // ?
scanner.getTokenText() // ?
