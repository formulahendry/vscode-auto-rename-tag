# Auto Rename Tag

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Installs](https://vsmarketplacebadge.apphb.com/installs/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Rating](https://vsmarketplacebadge.apphb.com/rating/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Build Status](https://travis-ci.org/formulahendry/vscode-auto-rename-tag.svg?branch=master)](https://travis-ci.org/formulahendry/vscode-auto-rename-tag)

Automatically rename paired HTML/XML tag, same as Visual Studio IDE does.

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

**Note:** The setting should be set with language id defined in [VS Code](https://github.com/Microsoft/vscode/tree/master/extensions). Taking [javascript definition](https://github.com/Microsoft/vscode/blob/master/extensions/javascript/package.json) as an example, we need to use `javascript` for `.js` and `.es6`, use `javascriptreact` for `.jsx`. So, if you want to enable this extension on `.js` file, you need to add `javascript` in settings.json.

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
