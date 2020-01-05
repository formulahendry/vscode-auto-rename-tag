// /* eslint-disable sonarjs/no-duplicate-string */
// import { createScanner, TokenType } from './htmlScanner'

// interface Token {
//   offset: number
//   type: TokenType
//   content?: string
// }

// interface TokenTest {
//   input: string
//   tokens: Token[]
// }

// // function isEmbeddedContent(tagName) {
// //   return ['script', 'style'].includes(tagName)
// // }

// function assertTokens(tests: TokenTest[]): void {
//   // const scannerState = ScannerState.WithinContent
//   for (const test of tests) {
//     const scanner = createScanner(test.input)
//     let tokenType = scanner.scan()
//     const actual: Token[] = []
//     while (tokenType !== TokenType.EOS) {
//       const actualToken: Token = {
//         offset: scanner.getTokenOffset(),
//         type: tokenType,
//       }
//       if (
//         tokenType === TokenType.StartTag ||
//         tokenType === TokenType.EndTag ||
//         tokenType === TokenType.Content
//       ) {
//         actualToken.content = scanner.getTokenText()
//       }
//       actual.push(actualToken)
//       tokenType = scanner.scan()
//     }
//     expect(actual).toEqual(test.tokens)
//     // scannerState = scanner.getScannerState()
//   }
// }

// function assertToken(test: TokenTest): void {
//   assertTokens([test])
// }

// test('Open Start Tag #1', () => {
//   assertToken({
//     input: '<abc',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//     ],
//   })
// })

// test('Open Start Tag #2', () => {
//   assertToken({
//     input: '<input',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'input' },
//     ],
//   })
// })

// test('Open Start Tag with Invalid Tag', () => {
//   assertToken({
//     input: '< abc',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.Content, content: ' abc' },
//     ],
//   })
// })

// test('Open Start Tag #3', () => {
//   assertToken({
//     input: '< abc>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.Content, content: ' abc>' },
//     ],
//   })
// })

// test('Open Start Tag #4', () => {
//   assertToken({
//     input: 'i <len;',
//     tokens: [
//       { offset: 0, type: TokenType.Content, content: 'i ' },
//       { offset: 2, type: TokenType.StartTagOpen },
//       { offset: 3, type: TokenType.StartTag, content: 'len;' },
//     ],
//   })
// })

// test('Open Start Tag #5', () => {
//   assertToken({
//     input: '<',
//     tokens: [{ offset: 0, type: TokenType.StartTagOpen }],
//   })
// })

// test('Open End Tag', () => {
//   assertToken({
//     input: '</a',
//     tokens: [
//       { offset: 0, type: TokenType.EndTagOpen },
//       { offset: 2, type: TokenType.EndTag, content: 'a' },
//     ],
//   })
// })

// test('Complete Start Tag', () => {
//   assertToken({
//     input: '<abc>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       { offset: 4, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('Complete Start Tag with Whitespace', () => {
//   assertToken({
//     input: '<abc >',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       // { offset: 4, type: TokenType.Whitespace },
//       { offset: 5, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('bug 9809 - Complete Start Tag with Namespaceprefix', () => {
//   assertToken({
//     input: '<foo:bar>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'foo:bar' },
//       { offset: 8, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('Complete End Tag', () => {
//   assertToken({
//     input: '</abc>',
//     tokens: [
//       { offset: 0, type: TokenType.EndTagOpen },
//       { offset: 2, type: TokenType.EndTag, content: 'abc' },
//       { offset: 5, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Complete End Tag with Whitespace', () => {
//   assertToken({
//     input: '</abc  >',
//     tokens: [
//       { offset: 0, type: TokenType.EndTagOpen },
//       { offset: 2, type: TokenType.EndTag, content: 'abc' },
//       { offset: 7, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Empty Tag', () => {
//   assertToken({
//     input: '<abc />',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       { offset: 5, type: TokenType.StartTagSelfClose },
//     ],
//   })
// })

// test('Embedded Content #1', () => {
//   assertToken({
//     input: '<script type="text/javascript">var i= 10;</script>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'script' },
//       { offset: 8, type: TokenType.AttributeName },
//       { offset: 12, type: TokenType.DelimiterAssign },
//       { offset: 13, type: TokenType.AttributeValue },
//       { offset: 30, type: TokenType.StartTagClose },
//       { offset: 31, type: TokenType.Content, content: 'var i= 10;' },
//       { offset: 41, type: TokenType.EndTagOpen },
//       { offset: 43, type: TokenType.EndTag, content: 'script' },
//       { offset: 49, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Embedded Content #2', () => {
//   assertTokens([
//     {
//       input: '<script type="text/javascript">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'script' },
//         { offset: 8, type: TokenType.AttributeName },
//         { offset: 12, type: TokenType.DelimiterAssign },
//         { offset: 13, type: TokenType.AttributeValue },
//         { offset: 30, type: TokenType.StartTagClose },
//       ],
//     },
//     {
//       input: 'var i= 10;',
//       tokens: [{ offset: 0, type: TokenType.Content, content: 'var i= 10;' }],
//     },
//     {
//       input: '</script>',
//       tokens: [
//         { offset: 0, type: TokenType.EndTagOpen },
//         { offset: 2, type: TokenType.EndTag, content: 'script' },
//         { offset: 8, type: TokenType.EndTagClose },
//       ],
//     },
//   ])
// })

// test('Embedded Content #3', () => {
//   assertTokens([
//     {
//       input: '<script type="text/javascript">var i= 10;',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'script' },
//         { offset: 8, type: TokenType.AttributeName },
//         { offset: 12, type: TokenType.DelimiterAssign },
//         { offset: 13, type: TokenType.AttributeValue },
//         { offset: 30, type: TokenType.StartTagClose },
//         { offset: 31, type: TokenType.Content, content: 'var i= 10;' },
//       ],
//     },
//     {
//       input: '</script>',
//       tokens: [
//         { offset: 0, type: TokenType.EndTagOpen },
//         { offset: 2, type: TokenType.EndTag, content: 'script' },
//         { offset: 8, type: TokenType.EndTagClose },
//       ],
//     },
//   ])
// })

// test('Embedded Content #4', () => {
//   assertTokens([
//     {
//       input: '<script type="text/javascript">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'script' },
//         { offset: 8, type: TokenType.AttributeName },
//         { offset: 12, type: TokenType.DelimiterAssign },
//         { offset: 13, type: TokenType.AttributeValue },
//         { offset: 30, type: TokenType.StartTagClose },
//       ],
//     },
//     {
//       input: 'var i= 10;</script>',
//       tokens: [
//         { offset: 0, type: TokenType.Content, content: 'var i= 10;' },
//         { offset: 10, type: TokenType.EndTagOpen },
//         { offset: 12, type: TokenType.EndTag, content: 'script' },
//         { offset: 18, type: TokenType.EndTagClose },
//       ],
//     },
//   ])
// })

// test('Embedded Content #5', () => {
//   assertToken({
//     input: '<script type="text/plain">a\n<a</script>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'script' },
//       { offset: 8, type: TokenType.AttributeName },
//       { offset: 12, type: TokenType.DelimiterAssign },
//       { offset: 13, type: TokenType.AttributeValue },
//       { offset: 25, type: TokenType.StartTagClose },
//       { offset: 26, type: TokenType.Content, content: 'a\n<a' },
//       { offset: 30, type: TokenType.EndTagOpen },
//       { offset: 32, type: TokenType.EndTag, content: 'script' },
//       { offset: 38, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Embedded Content #6', () => {
//   assertToken({
//     input: '<script>a</script><script>b</script>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'script' },
//       { offset: 7, type: TokenType.StartTagClose },
//       { offset: 8, type: TokenType.Content, content: 'a' },
//       { offset: 9, type: TokenType.EndTagOpen },
//       { offset: 11, type: TokenType.EndTag, content: 'script' },
//       { offset: 17, type: TokenType.EndTagClose },
//       { offset: 18, type: TokenType.StartTagOpen },
//       { offset: 19, type: TokenType.StartTag, content: 'script' },
//       { offset: 25, type: TokenType.StartTagClose },
//       { offset: 26, type: TokenType.Content, content: 'b' },
//       { offset: 27, type: TokenType.EndTagOpen },
//       { offset: 29, type: TokenType.EndTag, content: 'script' },
//       { offset: 35, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Embedded Content #7', () => {
//   assertToken({
//     input: '<script type="text/javascript"></script>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'script' },
//       { offset: 8, type: TokenType.AttributeName },
//       { offset: 12, type: TokenType.DelimiterAssign },
//       { offset: 13, type: TokenType.AttributeValue },
//       { offset: 30, type: TokenType.StartTagClose },
//       { offset: 31, type: TokenType.EndTagOpen },
//       { offset: 33, type: TokenType.EndTag, content: 'script' },
//       { offset: 39, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Embedded Content #8', () => {
//   assertTokens([
//     {
//       input: '<script>var i= 10;</script>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'script' },
//         { offset: 7, type: TokenType.StartTagClose },
//         { offset: 8, type: TokenType.Content, content: 'var i= 10;' },
//         { offset: 18, type: TokenType.EndTagOpen },
//         { offset: 20, type: TokenType.EndTag, content: 'script' },
//         { offset: 26, type: TokenType.EndTagClose },
//       ],
//     },
//   ])
// })

// test('Embedded Content #9', () => {
//   assertToken({
//     input: '<script type="text/javascript" src="main.js"></script>',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'script' },
//       { offset: 8, type: TokenType.AttributeName },
//       { offset: 12, type: TokenType.DelimiterAssign },
//       { offset: 13, type: TokenType.AttributeValue },
//       { offset: 31, type: TokenType.AttributeName },
//       { offset: 34, type: TokenType.DelimiterAssign },
//       { offset: 35, type: TokenType.AttributeValue },
//       { offset: 44, type: TokenType.StartTagClose },
//       { offset: 45, type: TokenType.EndTagOpen },
//       { offset: 47, type: TokenType.EndTag, content: 'script' },
//       { offset: 53, type: TokenType.EndTagClose },
//     ],
//   })
// })

// test('Tag with Attribute', () => {
//   assertToken({
//     input: '<abc foo="bar">',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       { offset: 5, type: TokenType.AttributeName },
//       { offset: 8, type: TokenType.DelimiterAssign },
//       { offset: 9, type: TokenType.AttributeValue },
//       { offset: 14, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('Tag with Empty Attribute Value', () => {
//   assertToken({
//     input: "<abc foo='bar'>",
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       { offset: 5, type: TokenType.AttributeName },
//       { offset: 8, type: TokenType.DelimiterAssign },
//       { offset: 9, type: TokenType.AttributeValue },
//       { offset: 14, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('Tag with empty attributes', () => {
//   assertToken({
//     input: '<abc foo="">',
//     tokens: [
//       { offset: 0, type: TokenType.StartTagOpen },
//       { offset: 1, type: TokenType.StartTag, content: 'abc' },
//       { offset: 5, type: TokenType.AttributeName },
//       { offset: 8, type: TokenType.DelimiterAssign },
//       { offset: 9, type: TokenType.AttributeValue },
//       { offset: 11, type: TokenType.StartTagClose },
//     ],
//   })
// })

// test('Tag with Attributes', () => {
//   assertTokens([
//     {
//       input: '<abc foo="bar" bar=\'foo\'>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.DelimiterAssign },
//         { offset: 9, type: TokenType.AttributeValue },
//         { offset: 15, type: TokenType.AttributeName },
//         { offset: 18, type: TokenType.DelimiterAssign },
//         { offset: 19, type: TokenType.AttributeValue },
//         { offset: 24, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Attributes, no quotes', () => {
//   assertTokens([
//     {
//       input: '<abc foo=bar bar=help-me>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.DelimiterAssign },
//         { offset: 9, type: TokenType.AttributeValue },
//         { offset: 13, type: TokenType.AttributeName },
//         { offset: 16, type: TokenType.DelimiterAssign },
//         { offset: 17, type: TokenType.AttributeValue },
//         { offset: 24, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Attributes, no quotes, self close', () => {
//   assertTokens([
//     {
//       input: '<abc foo=bar/>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.DelimiterAssign },
//         { offset: 9, type: TokenType.AttributeValue },
//         { offset: 12, type: TokenType.StartTagSelfClose },
//       ],
//     },
//   ])
// })

// test('Tag with Attribute And Whitespace', () => {
//   assertTokens([
//     {
//       input: '<abc foo=  "bar">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.DelimiterAssign },
//         { offset: 11, type: TokenType.AttributeValue },
//         { offset: 16, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Attribute And Whitespace #2', () => {
//   assertTokens([
//     {
//       input: '<abc foo = "bar">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 9, type: TokenType.DelimiterAssign },
//         { offset: 11, type: TokenType.AttributeValue },
//         { offset: 16, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Name-Only-Attribute #1', () => {
//   assertTokens([
//     {
//       input: '<abc foo>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Name-Only-Attribute #2', () => {
//   assertTokens([
//     {
//       input: '<abc foo bar>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 9, type: TokenType.AttributeName },
//         { offset: 12, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Interesting Attribute Name', () => {
//   assertTokens([
//     {
//       input: '<abc foo!@#="bar">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 11, type: TokenType.DelimiterAssign },
//         { offset: 12, type: TokenType.AttributeValue },
//         { offset: 17, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Angular Attribute Name', () => {
//   assertTokens([
//     {
//       input:
//         '<abc #myinput (click)="bar" [value]="someProperty" *ngIf="someCondition">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 14, type: TokenType.AttributeName },
//         { offset: 21, type: TokenType.DelimiterAssign },
//         { offset: 22, type: TokenType.AttributeValue },
//         { offset: 28, type: TokenType.AttributeName },
//         { offset: 35, type: TokenType.DelimiterAssign },
//         { offset: 36, type: TokenType.AttributeValue },
//         { offset: 51, type: TokenType.AttributeName },
//         { offset: 56, type: TokenType.DelimiterAssign },
//         { offset: 57, type: TokenType.AttributeValue },
//         { offset: 72, type: TokenType.StartTagClose },
//       ],
//     },
//   ])
// })

// test('Tag with Invalid Attribute Value', () => {
//   assertTokens([
//     {
//       input: '<abc foo=">',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'abc' },
//         { offset: 5, type: TokenType.AttributeName },
//         { offset: 8, type: TokenType.DelimiterAssign },
//         { offset: 9, type: TokenType.AttributeValue },
//       ],
//     },
//   ])
// })

// test('Simple Comment 1', () => {
//   assertTokens([
//     {
//       input: '<!--a-->',
//       tokens: [
//         { offset: 0, type: TokenType.StartCommentTag },
//         { offset: 4, type: TokenType.Comment },
//         { offset: 5, type: TokenType.EndCommentTag },
//       ],
//     },
//   ])
// })

// test('Simple Comment 2', () => {
//   assertTokens([
//     {
//       input: '<!--a>foo bar</a -->',
//       tokens: [
//         { offset: 0, type: TokenType.StartCommentTag },
//         { offset: 4, type: TokenType.Comment },
//         { offset: 17, type: TokenType.EndCommentTag },
//       ],
//     },
//   ])
// })

// test('Multiline Comment', () => {
//   assertTokens([
//     {
//       input: '<!--a>\nfoo \nbar</a -->',
//       tokens: [
//         { offset: 0, type: TokenType.StartCommentTag },
//         { offset: 4, type: TokenType.Comment },
//         { offset: 19, type: TokenType.EndCommentTag },
//       ],
//     },
//   ])
// })

// test('Simple Doctype', () => {
//   assertTokens([
//     {
//       input: '<!Doctype a>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         {
//           offset: 1,
//           type: TokenType.StartTag,
//           content: '!Doctype',
//         },
//         {
//           offset: 10,
//           type: TokenType.AttributeName,
//         },
//         {
//           offset: 11,
//           type: TokenType.StartTagClose,
//         },
//       ],
//     },
//   ])
// })

// test('Simple Doctype #2', () => {
//   assertTokens([
//     {
//       input: '<!doctype a>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: '!doctype' },
//         {
//           offset: 10,
//           type: TokenType.AttributeName,
//         },
//         {
//           offset: 11,
//           type: TokenType.StartTagClose,
//         },
//       ],
//     },
//   ])
// })

// test('Incomplete #1', () => {
//   assertTokens([
//     {
//       input: '    ',
//       tokens: [{ offset: 0, type: TokenType.Content, content: '    ' }],
//     },
//   ])
// })

// test('Incomplete #2', () => {
//   assertTokens([
//     {
//       input: '<!---   ',
//       tokens: [
//         { offset: 0, type: TokenType.StartCommentTag },
//         { offset: 4, type: TokenType.Comment },
//       ],
//     },
//   ])
// })

// test('Incomplete #3', () => {
//   assertTokens([
//     {
//       input: '<style>color:red',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'style' },
//         { offset: 6, type: TokenType.StartTagClose },
//         { offset: 7, type: TokenType.Content, content: 'color:red' },
//       ],
//     },
//   ])
// })

// test('Incomplete #4', () => {
//   assertTokens([
//     {
//       input: '<script>alert("!!")',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'script' },
//         { offset: 7, type: TokenType.StartTagClose },
//         { offset: 8, type: TokenType.Content, content: 'alert("!!")' },
//       ],
//     },
//   ])
// })

// test('Nested #1', () => {
//   assertTokens([
//     {
//       input: '<p>hello<em>world</em>!</p>',
//       tokens: [
//         { offset: 0, type: TokenType.StartTagOpen },
//         { offset: 1, type: TokenType.StartTag, content: 'p' },
//         { offset: 2, type: TokenType.StartTagClose },
//         {
//           offset: 3,
//           type: TokenType.Content,
//           content: 'hello',
//         },
//         {
//           offset: 8,
//           type: TokenType.StartTagOpen,
//         },
//         {
//           offset: 9,
//           type: TokenType.StartTag,
//           content: 'em',
//         },
//         {
//           offset: 11,
//           type: TokenType.StartTagClose,
//         },
//         {
//           content: 'world',
//           offset: 12,
//           type: TokenType.Content,
//         },
//         {
//           offset: 17,
//           type: TokenType.EndTagOpen,
//         },
//         {
//           content: 'em',
//           offset: 19,
//           type: TokenType.EndTag,
//         },
//         {
//           offset: 21,
//           type: TokenType.EndTagClose,
//         },
//         {
//           content: '!',
//           offset: 22,
//           type: TokenType.Content,
//         },
//         {
//           offset: 23,
//           type: TokenType.EndTagOpen,
//         },
//         {
//           content: 'p',
//           offset: 25,
//           type: TokenType.EndTag,
//         },
//         {
//           offset: 26,
//           type: TokenType.EndTagClose,
//         },
//       ],
//     },
//   ])
// })
