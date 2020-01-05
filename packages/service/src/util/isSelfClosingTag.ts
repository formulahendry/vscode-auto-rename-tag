const tagsThatAreSelfClosingInHtml: string[] = [
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "menuitem",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
const tagsThatAreSelfClosing: { [languageId: string]: string[] } = {
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
  javascriptreact: [],
  mustache: tagsThatAreSelfClosingInHtml,
  razor: tagsThatAreSelfClosingInHtml,
  svelte: tagsThatAreSelfClosingInHtml,
  svg: [],
  typescript: tagsThatAreSelfClosingInHtml,
  typescriptreact: [],
  twig: tagsThatAreSelfClosingInHtml,
  volt: tagsThatAreSelfClosingInHtml,
  vue: [],
  xml: []
};

export const isSelfClosingTagInLanguage: (
  languageId: string,
  tagName: string
) => boolean = (languageId, tagName) =>
  (
    tagsThatAreSelfClosing[languageId] || tagsThatAreSelfClosing["html"]
  ).includes(tagName);
