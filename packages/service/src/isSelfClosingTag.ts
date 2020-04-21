const tagsThatAreSelfClosingInHtml: Set<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

const EMPTY_SET: Set<string> = new Set();

const tagsThatAreSelfClosing: { [languageId: string]: Set<string> } = {
  css: tagsThatAreSelfClosingInHtml,
  ejs: tagsThatAreSelfClosingInHtml,
  ruby: tagsThatAreSelfClosingInHtml,
  html: tagsThatAreSelfClosingInHtml,
  markdown: tagsThatAreSelfClosingInHtml,
  marko: tagsThatAreSelfClosingInHtml,
  nunjucks: tagsThatAreSelfClosingInHtml,
  plaintext: tagsThatAreSelfClosingInHtml,
  php: tagsThatAreSelfClosingInHtml,
  javascript: tagsThatAreSelfClosingInHtml,
  javascriptreact: EMPTY_SET,
  mustache: tagsThatAreSelfClosingInHtml,
  razor: tagsThatAreSelfClosingInHtml,
  svelte: tagsThatAreSelfClosingInHtml,
  svg: EMPTY_SET,
  typescript: tagsThatAreSelfClosingInHtml,
  typescriptreact: EMPTY_SET,
  twig: tagsThatAreSelfClosingInHtml,
  volt: tagsThatAreSelfClosingInHtml,
  vue: EMPTY_SET,
  xml: EMPTY_SET
};

export const isSelfClosingTagInLanguage: (
  languageId: string
) => (tagName: string) => boolean = languageId => tagName =>
  (tagsThatAreSelfClosing[languageId] || tagsThatAreSelfClosing['html']).has(
    tagName
  );
