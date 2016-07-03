'use strict';
import * as vscode from 'vscode';
import { findPairedTag } from './tagParser';

export class TagManager {
    private _word: string;

    run() {
        vscode.window.onDidChangeTextEditorSelection(event => {
            this.getCurrentWord(event);
        })

        vscode.workspace.onDidChangeTextDocument(event => {
            this.updatePairedTag(event);
        });
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

    private getCurrentWord(event: vscode.TextEditorSelectionChangeEvent): void {
        let selection = event.selections[0];
        let document = event.textEditor.document;
        let range = document.getWordRangeAtPosition(selection.active);
        this._word = document.getText(range);
    }

    private updatePairedTag(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isEnabled()) {
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let document = editor.document;
        let selection = editor.selection;

        let cursorPositon = selection.active;
        if (event.contentChanges[0].text === "") {
            cursorPositon = cursorPositon.translate(0, -1);
        }

        let newWord = this.getNewWord(document, cursorPositon);
        if (newWord === null) {
            return;
        }

        this.findAndReplacePairedTag(document, editor, cursorPositon, newWord)
    }

    private getNewWord(document: vscode.TextDocument, cursorPositon: vscode.Position): string {
        let textLine = document.lineAt(cursorPositon);
        let text = textLine.text;
        let regex = /<(\/?[a-zA-Z][a-zA-Z0-9]*)(?:\s[^\s<>]*?[^\s/<>]+?)*?>/g;
        let result: string[];
        let index = -1;
        let character = cursorPositon.character;
        let newWord: string;

        while ((result = regex.exec(text)) !== null) {
            index = text.indexOf(result[1], index + 1);
            if (index <= character && character <= index + result[1].length) {
                return result[1];
            }
        }

        return null;
    }

    private findAndReplacePairedTag(document: vscode.TextDocument, editor: vscode.TextEditor,
        cursorPositon: vscode.Position, newWord: string): void {
        let startTag: string;
        let endTag: string;

        if (newWord.substr(0, 1) === "/") {
            newWord = newWord.substr(1);
            startTag = this._word;
            endTag = newWord
        } else {
            startTag = newWord;
            endTag = this._word
        }

        if (this._word === newWord) {
            return;
        }

        let pairedTag = findPairedTag(document.getText(), document.offsetAt(cursorPositon), startTag, endTag);
        if (!pairedTag) {
            return;
        }
        editor.edit((editBuilder) => {
            editBuilder.replace(new vscode.Range(document.positionAt(pairedTag.startOffset), document.positionAt(pairedTag.endOffset)), newWord);
        })
    }
}