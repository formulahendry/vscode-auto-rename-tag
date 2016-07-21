# Auto Rename Tag

[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Installs](http://vsmarketplacebadge.apphb.com/installs/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Rating](http://vsmarketplacebadge.apphb.com/rating/formulahendry.auto-rename-tag.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) [![Build Status](https://travis-ci.org/formulahendry/vscode-auto-rename-tag.svg?branch=master)](https://travis-ci.org/formulahendry/vscode-auto-rename-tag)

Automatically rename paired HTML/XML tag, same as Visual Studio IDE does.

## Features

* When you rename one HTML/XML tag, automatically rename the paired HTML/XML tag

## Usages

![Usage](images/usage.gif)

## Configuration

Add entry into `auto-rename-tag.activationOnLanguage` to set the languages that the extension will be activated.
By default, it is `["*"]` and will be activated for all languages.
```json
{
    "auto-rename-tag.activationOnLanguage": [
        "html",
        "xml",
        "php",
        "javascript"
    ]
}
```
**Note:** The setting should be set with language id defined in [VS Code](https://github.com/Microsoft/vscode/tree/master/extensions). Taking [javascript definition](https://github.com/Microsoft/vscode/blob/master/extensions/javascript/package.json) as an example, we need to use `javascript` for `.js` and `.es6`, use `javascriptreact` for `.jsx`. So, if you want to enable this extension on `.js` file, you need to add `javascript` in settings.json.

## Change Log
### 0.0.6
* Merge [PR#7](https://github.com/formulahendry/vscode-auto-rename-tag/pull/7): Remove console.log
* Update README.md to clarify the configuration for `auto-rename-tag.activationOnLanguage`

### 0.0.5
* Fix [GitHub issue#6](https://github.com/formulahendry/vscode-auto-rename-tag/issues/6)

### 0.0.4
* Add support for tag name that contains ```- _ : .```

### 0.0.3
* Fix paired tags not updated when there are void elements or self-closing tags between paired tags
* Fix [GitHub issue#2](https://github.com/formulahendry/vscode-auto-rename-tag/issues/2)
* Fix [GitHub issue#3](https://github.com/formulahendry/vscode-auto-rename-tag/issues/3)
* Parse document independently instead of using SAXParser of parse5 npm package to avoid uncontrollable parse behavior

### 0.0.2
* Update logo

### 0.0.1
* Initial Release

## Issues
Submit the [issues](https://github.com/formulahendry/vscode-auto-rename-tag/issues) if you find any bug or have any suggestion.

## Contribution
Fork the [repo](https://github.com/formulahendry/vscode-auto-rename-tag) and submit pull requests.