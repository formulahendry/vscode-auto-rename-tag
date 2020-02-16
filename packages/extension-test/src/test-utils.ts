import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';
import * as Mocha from 'mocha';
import * as fs from 'fs';

const packageJSON = JSON.parse(
  fs.readFileSync(path.join(process.env.extensionPath, 'package.json'), 'utf-8')
) as { name: string; publisher: string };

const extension = vscode.extensions.getExtension(
  `${packageJSON.publisher}.${packageJSON.name}`
) as vscode.Extension<any>;

assert.ok(extension);

export const activateExtension = () => extension.activate();

export interface TestCase {
  input?: string;
  literalInput?: string;
  offset?: number;
  type?: string;
  expect?: string;
  expectOtherFiles?: { [key: string]: string };
  only?: boolean;
  speed?: number;
  skip?: boolean;
  timeout?: 'never' | number;
  debug?: boolean;
  waitForAutoComplete?: 1;
  selection?: [number, number];
  afterTypeCommands?: string[];
  undoStops?: boolean;
}

export async function createTestFile(
  fileName: string,
  content: string = ''
): Promise<void> {
  const filePath = path.join(
    vscode.workspace.workspaceFolders![0].uri.fsPath,
    fileName
  );
  fs.writeFileSync(filePath, content);
  const uri = vscode.Uri.file(filePath);
  await vscode.window.showTextDocument(uri);
}

export async function removeTestFile(): Promise<void> {
  const uri = vscode.window.activeTextEditor?.document.uri as vscode.Uri;
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  await vscode.workspace.fs.delete(uri);
}

export async function setText(text: string): Promise<void> {
  const document = vscode.window.activeTextEditor!.document;
  const all = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );
  await vscode.window.activeTextEditor!.edit(editBuilder =>
    editBuilder.replace(all, text)
  );
}

function setCursorPositions(offsets: number[]): void {
  const positions = offsets.map(offset =>
    vscode.window.activeTextEditor!.document.positionAt(offset)
  );
  const selections = positions.map(
    position => new vscode.Selection(position, position)
  );
  vscode.window.activeTextEditor!.selections = selections;
}

async function typeLiteral(text: string, undoStops = false): Promise<void> {
  await vscode.window.activeTextEditor!.insertSnippet(
    new vscode.SnippetString(text),
    vscode.window.activeTextEditor!.selections,
    {
      undoStopAfter: undoStops,
      undoStopBefore: undoStops
    }
  );
}

async function typeDelete(times: number = 1): Promise<void> {
  const offsets = vscode.window.activeTextEditor!.selections.map(selection =>
    vscode.window.activeTextEditor!.document.offsetAt(selection.active)
  );
  await new Promise(async resolve => {
    await vscode.window.activeTextEditor!.edit(editBuilder => {
      for (const offset of offsets) {
        editBuilder.delete(
          new vscode.Range(
            vscode.window.activeTextEditor!.document.positionAt(offset - times),
            vscode.window.activeTextEditor!.document.positionAt(offset)
          )
        );
      }
    });
    resolve();
  });
}
async function type(
  text: string,
  speed = 150,
  undoStops = false
): Promise<void> {
  for (let i = 0; i < text.length; i++) {
    if (i === 0) {
      await new Promise(resolve => setTimeout(resolve, speed / 2));
    } else {
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    if (text.slice(i).startsWith('{backspace}')) {
      await typeDelete();
      i += '{backspace}'.length - 1;
    } else if (text.slice(i).startsWith('{undo}')) {
      await vscode.commands.executeCommand('undo');
      i += '{undo}'.length - 1;
    } else if (text.slice(i).startsWith('{redo}')) {
      await vscode.commands.executeCommand('redo');
      i += '{redo}'.length - 1;
    } else if (text.slice(i).startsWith('{tab}')) {
      await vscode.commands.executeCommand('html-expand-abbreviation');
      i += '{tab}'.length - 1;
    } else if (text.slice(i).startsWith('{end}')) {
      await vscode.commands.executeCommand('cursorEnd');
      i += '{end}'.length - 1;
    } else if (text.slice(i).startsWith('{down}')) {
      await vscode.commands.executeCommand('cursorDown');
      i += '{down}'.length - 1;
    } else if (text.slice(i).startsWith('{copyLineDown}')) {
      await vscode.commands.executeCommand(
        'editor!.action.copyLinesDownAction'
      );
      i += '{copyLineDown}'.length - 1;
    } else {
      await typeLiteral(text[i], undoStops);
    }
  }
}

async function waitForAutoComplete(timeout: 'never' | number) {
  return new Promise(resolve => {
    const disposable = vscode.workspace.onDidChangeTextDocument(() => {
      disposable.dispose();
      resolve();
    });
    if (timeout !== 'never') {
      setTimeout(resolve, timeout);
    }
  });
}

export function getText(): string {
  return vscode.window.activeTextEditor!.document.getText();
}

export async function run(
  testCases: TestCase[],
  { speed = 0, timeout = 40, afterCommands = [] as any[] } = {}
) {
  await setText('');
  const only = testCases.filter(testCase => testCase.only);
  const applicableTestCases = only.length ? only : testCases;
  for (const testCase of applicableTestCases) {
    if (testCase.skip) {
      continue;
    }
    if (testCase.literalInput !== undefined) {
      await setText(testCase.literalInput);
    }
    if (testCase.offset !== undefined) {
      setCursorPositions([testCase.offset]);
    }
    if (testCase.input !== undefined) {
      const cursorOffsets = [];
      for (let i = 0; i < testCase.input.length; i++) {
        if (testCase.input[i] === '|') {
          cursorOffsets.push(i - cursorOffsets.length);
        }
      }
      const input = testCase.input.replace(/\|/g, '');
      await setText(input);
      if (cursorOffsets.length > 0) {
        setCursorPositions(cursorOffsets);
      }
    }
    if (testCase.selection) {
      const [start, end] = testCase.selection;
      vscode.window.activeTextEditor!.selection = new vscode.Selection(
        vscode.window.activeTextEditor!.document.positionAt(start),
        vscode.window.activeTextEditor!.document.positionAt(end)
      );
    }
    if (testCase.type) {
      await type(
        testCase.type,
        testCase.speed || speed,
        testCase.undoStops || false
      );
      const autoCompleteTimeout = testCase.timeout || timeout;
      await waitForAutoComplete(autoCompleteTimeout);
    }

    const resolvedAfterCommands = testCase.afterTypeCommands || afterCommands;
    for (const afterCommand of resolvedAfterCommands) {
      await vscode.commands.executeCommand(afterCommand);
      const autoCompleteTimeout = testCase.timeout || timeout;
      await waitForAutoComplete(autoCompleteTimeout);
    }
    // await vscode.commands.executeCommand('type', { text: 'Hello' })
    const result = getText();
    if (testCase.debug) {
      await new Promise(() => {});
    }
    if (testCase.expect !== undefined) {
      assert.equal(result, testCase.expect);
    }
    if (testCase.expectOtherFiles) {
      for (const [relativePath, expectedContent] of Object.entries(
        testCase.expectOtherFiles
      )) {
        const absolutePath = path.join(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          relativePath
        );
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.file(absolutePath)
        );
        const actualContent = document.getText();
        assert.equal(actualContent, expectedContent);
      }
    }
  }
}

export const slowSpeed = 200;

export const slowTimeout = 7000;

export const createRunner: (
  dirname: string
) => () => Promise<void> = dirname => () => {
  const mocha = new Mocha({
    ui: 'tdd',
    timeout: 1000000
  });
  mocha.useColors(true);
  mocha.bail(true);

  return new Promise((resolve, reject) => {
    const fileNames = fs
      .readdirSync(dirname)
      .filter(fileName => fileName.endsWith('.test.js'));
    for (const fileName of fileNames) {
      mocha.addFile(path.join(dirname, fileName));
    }
    try {
      mocha.run(failures => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
