'use strict';
import { ExtensionContext } from 'vscode';
import { TagManager } from './tagManager';

export function activate(context: ExtensionContext) {
    let tagManager = new TagManager();
    tagManager.run();
}

export function deactivate() {
}


