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
        this._word = word;
    }

    private getCurrentWord(event: vscode.TextEditorSelectionChangeEvent): void {
        let selection = event.selections[0];
        let document = event.textEditor.document;
        let word = this.getWordAtPosition(document, selection.active);
        this._word = word;
    }

    private getWordAtPosition(document: vscode.TextDocument, position: vscode.Position): string {
        if (position.line > document.lineCount) {
            return null;
        }

        let textLine = document.lineAt(position);
        let text = textLine.text;
        let regex = /[<\/]([^\/\s<>]*)?[\s>]/g;
        let result = null;
        let character = position.character;

        while ((result = regex.exec(text)) !== null) {
            if (!result[1]) {
                if (result.index === character || result.index + 1 === character) {
                    return "";
                }
            } else {
                if (result.index + 1 <= character && character <= result.index + 2 + result[1].length) {
                    return result[1];
                }
            }
        }

        return null;
    }

    private isEnabled(): boolean {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return false;
        }
        let languageId = vscode.window.activeTextEditor.document.languageId;
        let config = vscode.workspace.getConfiguration('auto-rename-tag', editor.document.uri);
        let languages = config.get<string[]>("activationOnLanguage", ["*"]);
        if (languages.indexOf("*") === -1 && languages.lastIndexOf(languageId) === -1) {
            return false;
        } else {
            return true;
        }
    }

    private updatePairedTag(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isEnabled() || !event.contentChanges[0] ||
            /\r|\n/.test(event.contentChanges[0].text) || !event.contentChanges[0].range.isSingleLine) {
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let document = editor.document;
        let selection = editor.selection;

        let cursorPositon = selection.active;
        let rangeStart = event.contentChanges[0].range.start;
        let rangeEnd = event.contentChanges[0].range.end;
        if (!rangeStart.isEqual(rangeEnd)) {
            // Handle deletion or update of multi-character
            if (rangeStart.isBefore(rangeEnd)) {
                cursorPositon = rangeStart;
            } else {
                cursorPositon = rangeEnd;
            }
        }

        let newTag = this.getNewWord(document, cursorPositon);
        if (newTag === null) {
            return;
        }

        this.findAndReplacePairedTag(document, editor, cursorPositon, newTag);

        let word = this.getWordAtPosition(document, selection.active);
        this._word = word;
    }

    private getNewWord(document: vscode.TextDocument, cursorPositon: vscode.Position): Tag {
        let textLine = document.lineAt(cursorPositon);
        let text = textLine.text;
        let regex = /<(\/?)([^\/\s<>]*)?(?:\s[^\s<>]*?[^\s/<>]+?)*?>/g;
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
                if (index <= character && character <= index + 1 + result[2].length) {
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

        if (this._word === newTag.word || this._word === null) {
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
        }, { undoStopBefore: false, undoStopAfter: false })

        if (newTag.word === "") {
            this._word = "";
            this._emptyTagOffset = pairedTag.startOffset;
        }
    }
}