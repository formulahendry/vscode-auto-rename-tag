export const getIndent = (source: string, startOffset: number) => {
  let indent = 0;
  while (indent <= startOffset && source[startOffset - indent] !== '\n') {
    indent++;
  }
  return indent;
};
