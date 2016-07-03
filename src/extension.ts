'use strict';
import { ExtensionContext } from 'vscode';
import { TagManager } from './tagManager';

export function activate(context: ExtensionContext) {
    console.log('Congratulations, your extension "auto-rename-tag" is now active!');

    let tagManager = new TagManager();
    tagManager.run();
}

export function deactivate() {
}


