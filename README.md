# Auto Rename Tag

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Installs](https://vsmarketplacebadge.apphb.com/installs/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Rating](https://vsmarketplacebadge.apphb.com/rating/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Build Status](https://travis-ci.org/formulahendry/vscode-auto-rename-tag.svg?branch=master)](https://travis-ci.org/formulahendry/vscode-auto-rename-tag)

Automatically rename paired HTML/XML tag, same as Visual Studio IDE does.

## Sponsors

<p><a title="Try CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&amp;utm_campaign=autorenametag&amp;utm_medium=banner"><img src="https://alt-images.codestream.com/codestream_logo_autorenametag.png"></a><br>
Request and perform code reviews from inside your IDE.  Review any code, even if it's a work-in-progress that hasn't been committed yet, and use jump-to-definition, your favorite keybindings, and other IDE tools.<br> <a title="Try CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&amp;utm_campaign=autorenametag&amp;utm_medium=banner">Try it free</a></p>

## Book for VS Code

[《Visual Studio Code 权威指南》](https://union-click.jd.com/jdc?e=jdext-1261348777639735296-0&p=AyIGZRhbHQsWAVIaXxEyEgRdG1sRBxU3EUQDS10iXhBeGlcJDBkNXg9JHUlSSkkFSRwSBF0bWxEHFRgMXgdIMkRxFAUJD1RQZT0cBnwKDE4%2BaDpgB2ILWStbHAIQD1QaWxIBIgdUGlsRBxEEUxprJQIXNwd1g6O0yqLkB4%2B%2FjcePwitaJQIWD1cfWhwKGwVSG1wlAhoDZc31gdeauIyr%2FsOovNLYq46cqca50ytrJQEiXABPElAeEgRSG1kQCxQBUxxZHQQQA1YTXAkDIgdUGlscChECXRs1FGwSD1UbWRALFwRWK1slASJZOxoLRlUXU1NONU9QEkdXWRlJbBUDVB9TFgAVN1caWhcA)：带你深入浅出 VS Code！

![Book](images/book.jpg)

## ❤️ Contributors

Kudos to [@SimonSiefke](https://github.com/SimonSiefke) for rewriting the logic of this extension!

## Features

- When you rename one HTML/XML tag, automatically rename the paired HTML/XML tag

## Usages

![Usage](images/usage.gif)

## Configuration

Add entry into `auto-rename-tag.activationOnLanguage` to set the languages that the extension will be activated.
By default, it is `["*"]` and will be activated for all languages.

```json
{
  "auto-rename-tag.activationOnLanguage": ["html", "xml", "php", "javascript"]
}
```

The setting should be set with language id defined in [VS Code](https://github.com/Microsoft/vscode/tree/master/extensions). Taking [javascript definition](https://github.com/Microsoft/vscode/blob/master/extensions/javascript/package.json) as an example, we need to use `javascript` for `.js` and `.es6`, use `javascriptreact` for `.jsx`. So, if you want to enable this extension on `.js` file, you need to add `javascript` in settings.json.

## Note

From 1.44, VS Code offers the built-in [Rename On Type](https://code.visualstudio.com/updates/v1_44#_synced-regions) support for HTML and Handlebars that can be enabled with the setting `editor.renameOnType`. If this setting is enabled, this extension will skip HTML and Handlebars files regardless of the languages listed in `auto-rename-tag.activationOnLanguage`

## Change Log

See Change Log [here](CHANGELOG.md)

## Issues

Submit the [issues](https://github.com/formulahendry/vscode-auto-rename-tag/issues) if you find any bug or have any suggestion.

## Contribution

Fork the [repo](https://github.com/formulahendry/vscode-auto-rename-tag) and submit pull requests.

<!--
TODO REACT BUG: const Navigation = ()=><>
</>
type nav
-->
