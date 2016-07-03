# Auto Rename Tag

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
        "php"
    ]
}
```

## Change Log
### 0.0.2
* Update logo

### 0.0.1
* Initial Release

## Issues
Submit the [issues](https://github.com/formulahendry/vscode-auto-rename-tag/issues) if you find any bug or have any suggestion.

## Contribution
Fork the [repo](https://github.com/formulahendry/vscode-auto-rename-tag) and submit pull requests.