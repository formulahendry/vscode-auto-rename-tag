"use strict";

import * as vscode from "vscode";
import * as assert from 'assert';
import {join} from 'path';
import * as os from 'os';
import * as fs from 'fs';

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function rndName() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

async function createRandomFile(contents: string): Promise<vscode.Uri> {
    const tmpFile = join(os.tmpdir(), rndName());

    try {
        fs.writeFileSync(tmpFile, contents);
        return vscode.Uri.file(tmpFile);
    } catch (error) {
        throw error;
    }
}

export async function setupWorkspace(): Promise<any> {
    const file = await createRandomFile("");
    const doc = await vscode.workspace.openTextDocument(file);

    await vscode.window.showTextDocument(doc);

    assert.ok(vscode.window.activeTextEditor);
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