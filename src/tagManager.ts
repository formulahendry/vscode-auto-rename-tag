'use strict';
import * as vscode from 'vscode';
import { findPairedTag, emptyTagName } from './tagParser';

interface Tag {
    word: string;
    isStartTag: boolean;
}

export class TagManager {
    private _word: string;
    private _emptyTagOffset: number;

    run() {
        vscode.window.onDidChangeActiveTextEditor(event => {
            this.getCurrentWordForNewActiveTextEditor(event);
        })

        vscode.window.onDidChangeTextEditorSelection(event => {
            this.getCurrentWord(event);
        })

        vscode.workspace.onDidChangeTextDocument(event => {
            this.updatePairedTag(event);
        });
    }

    private getCurrentWordForNewActiveTextEditor(editor: vscode.TextEditor): void {
        if (!editor) {
            return;
        }
        let document = editor.document;
        let selection = editor.selection;
        let word = this.getWordAtPosition(document, selection.active);
        if (word) {
            this._word = word;
        }
    }

    private getCurrentWord(event: vscode.TextEditorSelectionChangeEvent): void {
        let selection = event.selections[0];
        let document = event.textEditor.document;
        let word = this.getWordAtPosition(document, selection.active);
        if (word) {
            this._word = word;
        }
    }

    private getWordAtPosition(document: vscode.TextDocument, position: vscode.Position): string {
        let textLine = document.lineAt(position);
        let text = textLine.text;
        let regex = /[<\/]([a-zA-Z][a-zA-Z0-9-_:.]*)?[\s>]/g;
        let result = null;
        let character = position.character;

        while ((result = regex.exec(text)) !== null) {
            if (!result[1]) {
                if (result.index + 1 === character) {
                    return "";
                }
            } else {
                if (result.index + 1 <= character && character <= result.index + 1 + result[1].length) {
                    return result[1];
                }
            }
        }

        return null;
    }

    private isEnabled(): boolean {
        let languageId = vscode.window.activeTextEditor.document.languageId;
        let config = vscode.workspace.getConfiguration('auto-rename-tag');
        let languages = config.get<string[]>("activationOnLanguage", ["*"]);
        if (languages.indexOf("*") === -1 && languages.lastIndexOf(languageId) === -1) {
            return false;
        } else {
            return true;
        }
    }

    private updatePairedTag(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isEnabled()) {
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let document = editor.document;
        let selection = editor.selection;

        let cursorPositon = selection.active;
        if (event.contentChanges[0].text === "" || !selection.start.isEqual(selection.end)) {
            if (selection.start.isEqual(selection.end)) {
                cursorPositon = cursorPositon.translate(0, -1);
            } else {
                // Handle deletion or update of multi-character
                if (selection.start.isBefore(selection.end)) {
                    cursorPositon = selection.start;
                } else {
                    cursorPositon = selection.end;
                }
            }
        }

        let newTag = this.getNewWord(document, cursorPositon);
        if (newTag === null) {
            return;
        }

        this.findAndReplacePairedTag(document, editor, cursorPositon, newTag)
    }

    private getNewWord(document: vscode.TextDocument, cursorPositon: vscode.Position): Tag {
        let textLine = document.lineAt(cursorPositon);
        let text = textLine.text;
        let regex = /<(\/?)([a-zA-Z][a-zA-Z0-9-_:.]*)?(?:\s[^\s<>]*?[^\s/<>]+?)*?>/g;
        let result = null;
        let character = cursorPositon.character;

        while ((result = regex.exec(text)) !== null) {
            let isStartTag = result[1] === "";
            let offset = isStartTag ? 1 : 2;
            let index = result.index + offset;
            if (!result[2]) {
                if (index === character) {
                    return { word: "", isStartTag: isStartTag };
                }
            } else {
                if (index <= character && character <= index + result[2].length) {
                    return { word: result[2], isStartTag: isStartTag };
                }
            }
        }

        return null;
    }

    private findAndReplacePairedTag(document: vscode.TextDocument, editor: vscode.TextEditor,
        cursorPositon: vscode.Position, newTag: Tag): void {
        let startTag: string;
        let endTag: string;

        if (this._word === newTag.word) {
            return;
        }

        if (newTag.isStartTag) {
            startTag = newTag.word;
            endTag = this._word
        } else {
            startTag = this._word;
            endTag = newTag.word
        }

        let emptyTagOffset = null;
        if (newTag.word === "") {
            emptyTagOffset = document.offsetAt(cursorPositon);
        } else if (this._word == "") {
            emptyTagOffset = this._emptyTagOffset;
            if (newTag.isStartTag) {
                emptyTagOffset += newTag.word.length;
            }
        }

        let pairedTag = findPairedTag(document.getText(), document.offsetAt(cursorPositon), startTag, endTag, newTag.isStartTag, emptyTagOffset);
        if (!pairedTag) {
            return;
        }

        if (startTag === "" && newTag.isStartTag) {
            pairedTag.startOffset -= emptyTagName.length;
            pairedTag.endOffset -= emptyTagName.length;
        }
        if (endTag === "" && newTag.isStartTag) {
            pairedTag.endOffset = pairedTag.startOffset;
        }
        if (startTag === "" && !newTag.isStartTag) {
            pairedTag.endOffset = pairedTag.startOffset;
        }

        editor.edit((editBuilder) => {
            editBuilder.replace(new vscode.Range(document.positionAt(pairedTag.startOffset), document.positionAt(pairedTag.endOffset)), newTag.word);
        })

        if (newTag.word === "") {
            this._word = "";
            this._emptyTagOffset = pairedTag.startOffset;
        }
    }
}