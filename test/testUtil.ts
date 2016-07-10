"use strict";

import * as vscode from "vscode";
import * as assert from 'assert';

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export function insertAtPosition(documentText: string, insertValue: string, pos: vscode.Position,
    expected: string, done: MochaDone) {
    let editor = vscode.window.activeTextEditor;
    let range = editor.document.lineAt(0).range;
    editor.edit(editBuilder => {
        editBuilder.replace(range, documentText);
    }).then(() => {
        editor.edit(editBuilder => {
            editor.selection = new vscode.Selection(pos, pos)
            editBuilder.insert(pos, insertValue);
        }).then(() => {
            sleep(200).then(() => {
                assert.equal(editor.document.lineAt(0).text, expected);
                done();
            });
        })
    });
}