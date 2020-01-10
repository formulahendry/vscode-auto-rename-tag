import { AssertionError } from 'assert';
import 'source-map-support/register';
import * as vscode from 'vscode';
import {
  RequestType,
  TextDocumentIdentifier,
  LanguageClientOptions
} from 'vscode-languageclient';
import {
  createLanguageClientProxy,
  LanguageClientProxy
} from './createLanguageClientProxy';

interface Tag {
  word: string;
  offset: number;
  oldWord: string;
  previousOffset: number;
}

interface Params {
  readonly textDocument: TextDocumentIdentifier;
  readonly tags: Tag[];
}

interface Result {
  readonly originalOffset: number;
  readonly originalWord: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly tagName: string;
}

const assertDefined: <T>(value: T) => asserts value is NonNullable<T> = val => {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'value' to be defined, but received ${val}`
    });
  }
};

const autoRenameTagRequestType = new RequestType<Params, Result[], any, any>(
  '$/auto-rename-tag'
);

// TODO implement max concurrent requests

const askServerForAutoCompletionsElementRenameTag: (
  languageClientProxy: LanguageClientProxy,
  document: vscode.TextDocument,
  tags: Tag[]
) => Promise<Result[]> = async (languageClientProxy, document, tags) => {
  const params: Params = {
    textDocument: languageClientProxy.code2ProtocolConverter.asTextDocumentIdentifier(
      document
    ),
    tags
  };
  return languageClientProxy.sendRequest(autoRenameTagRequestType, params);
};

/**
 * Utility variable that stores the last changed version (document.uri.fsPath and document.version)
 * When a change was caused by auto-rename-tag, we can ignore that change, which is a simple performance improvement. One thing to take care of is undo, but that works now (and there are test cases).
 */
let lastChangeByAutoRenameTag: { fsPath: string; version: number } = {
  fsPath: '',
  version: -1
};

const applyResults: (results: Result[]) => Promise<void> = async results => {
  assertDefined(vscode.window.activeTextEditor);
  const prev = vscode.window.activeTextEditor.document.version;
  const applied = await vscode.window.activeTextEditor.edit(
    editBuilder => {
      assertDefined(vscode.window.activeTextEditor);
      for (const result of results) {
        const startPosition = vscode.window.activeTextEditor.document.positionAt(
          result.startOffset
        );
        const endPosition = vscode.window.activeTextEditor.document.positionAt(
          result.endOffset
        );
        const range = new vscode.Range(startPosition, endPosition);
        editBuilder.replace(range, result.tagName);
      }
    },
    {
      undoStopBefore: false,
      undoStopAfter: false
    }
  );
  const next = vscode.window.activeTextEditor.document.version;
  if (!applied) {
    return;
  }
  if (prev + 1 !== next) {
    return;
  }

  for (const result of results) {
    const oldWordAtOffset = wordsAtOffsets[result.originalOffset];
    delete wordsAtOffsets[result.originalOffset];

    let moved = 0;
    if (result.originalWord.startsWith('</')) {
      moved = result.endOffset - result.startOffset + 2;
    }
    wordsAtOffsets[result.originalOffset + moved] = {
      newWord: oldWordAtOffset && oldWordAtOffset.newWord,
      oldWord: result.originalWord
    };
  }
  lastChangeByAutoRenameTag = {
    fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
    version: vscode.window.activeTextEditor.document.version
  };
};

let latestCancelTokenSource: vscode.CancellationTokenSource | undefined;
let previousText: string | undefined;
const tagNameReLeft = /<\/?[^<>\s\\\/\'\"\(\)\`\{\}\[\]]*$/;
const tagNameRERight = /^[^<>\s\\\/\'\"\(\)\`\{\}\[\]]*/;

let wordsAtOffsets: {
  [offset: string]: {
    oldWord: string;
    newWord: string;
  };
} = {};

const updateWordsAtOffset: (tags: Tag[]) => void = tags => {
  const keys = Object.keys(wordsAtOffsets);
  if (keys.length > 0) {
    if (keys.length !== tags.length) {
      wordsAtOffsets = {};
    }
    for (const tag of tags) {
      if (!wordsAtOffsets.hasOwnProperty(tag.previousOffset)) {
        wordsAtOffsets = {};
        break;
      }
    }
  }
  for (const tag of tags) {
    wordsAtOffsets[tag.offset] = {
      oldWord:
        (wordsAtOffsets[tag.previousOffset] &&
          wordsAtOffsets[tag.previousOffset].oldWord) ||
        tag.oldWord,
      newWord: tag.word
    };
    if (tag.previousOffset !== tag.offset) {
      delete wordsAtOffsets[tag.previousOffset];
    }
    tag.oldWord = wordsAtOffsets[tag.offset].oldWord;
  }
};
const doAutoCompletionElementRenameTag: (
  languageClientProxy: LanguageClientProxy,
  tags: Tag[]
) => Promise<void> = async (languageClientProxy, tags) => {
  if (latestCancelTokenSource) {
    latestCancelTokenSource.cancel();
  }
  const cancelTokenSource = new vscode.CancellationTokenSource();
  latestCancelTokenSource = cancelTokenSource;
  if (!vscode.window.activeTextEditor) {
    return;
  }
  const beforeVersion = vscode.window.activeTextEditor.document.version;
  const results = await askServerForAutoCompletionsElementRenameTag(
    languageClientProxy,
    vscode.window.activeTextEditor.document,
    tags
  );
  if (cancelTokenSource.token.isCancellationRequested) {
    return;
  }
  if (latestCancelTokenSource === cancelTokenSource) {
    latestCancelTokenSource = undefined;
    cancelTokenSource.dispose();
  }
  if (results.length === 0) {
    wordsAtOffsets = {};
    return;
  }
  if (!vscode.window.activeTextEditor) {
    return;
  }
  const afterVersion = vscode.window.activeTextEditor.document.version;
  if (beforeVersion !== afterVersion) {
    return;
  }
  await applyResults(results);
};

const setPreviousText: (
  textEditor: vscode.TextEditor | undefined
) => void = textEditor => {
  if (textEditor) {
    previousText = textEditor.document.getText();
  } else {
    previousText = undefined;
  }
};

const isEnabledLanguageId: (languageId: string) => boolean = () => {
  return true;
};

export const activate: (
  context: vscode.ExtensionContext
) => Promise<void> = async context => {
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: 'file'
      },
      {
        scheme: 'untitled'
      }
    ]
  };
  const languageClientProxy = await createLanguageClientProxy(
    context,
    'auto-rename-tag',
    'Auto Rename Tag',
    clientOptions
  );
  setPreviousText(vscode.window.activeTextEditor);
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(setPreviousText)
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async event => {
      if (event.document !== vscode.window.activeTextEditor?.document) {
        return;
      }
      const currentText = event.document.getText();
      if (!isEnabledLanguageId(event.document.languageId)) {
        return;
      }
      if (event.contentChanges.length === 0) {
        return;
      }
      const tags: Tag[] = [];
      let totalInserted = 0;
      const sortedChanges = event.contentChanges
        .slice()
        .sort((a, b) => a.rangeOffset - b.rangeOffset);
      const keys = Object.keys(wordsAtOffsets);
      for (const change of sortedChanges) {
        for (const key of keys) {
          const parsedKey = parseInt(key, 10);
          if (
            change.rangeOffset <= parsedKey &&
            parsedKey <= change.rangeOffset + change.rangeLength
          ) {
            delete wordsAtOffsets[key];
          }
        }
        assertDefined(previousText);
        const line = event.document.lineAt(change.range.start.line);
        const lineStart = event.document.offsetAt(line.range.start);
        const lineChangeOffset = change.rangeOffset - lineStart;
        const lineLeft = line.text.slice(0, lineChangeOffset + totalInserted);
        const lineRight = line.text.slice(lineChangeOffset + totalInserted);
        const lineTagNameLeft = lineLeft.match(tagNameReLeft);
        const lineTagNameRight = lineRight.match(tagNameRERight);
        const previousTextRight = previousText.slice(change.rangeOffset);
        const previousTagNameRight = previousTextRight.match(tagNameRERight);
        let newWord: string;
        let oldWord: string;

        if (!lineTagNameLeft) {
          totalInserted += change.text.length - change.rangeLength;
          continue;
        }
        newWord = lineTagNameLeft[0];
        oldWord = lineTagNameLeft[0];
        if (lineTagNameRight) {
          newWord += lineTagNameRight[0];
        }
        if (previousTagNameRight) {
          oldWord += previousTagNameRight[0];
        }

        const offset =
          change.rangeOffset - lineTagNameLeft[0].length + totalInserted;
        tags.push({
          oldWord,
          word: newWord,
          offset,
          previousOffset: offset - totalInserted
        });
        totalInserted += change.text.length - change.rangeLength;
      }
      updateWordsAtOffset(tags);
      if (tags.length === 0) {
        previousText = currentText;
        return;
      }
      assertDefined(vscode.window.activeTextEditor);
      const beforeVersion = vscode.window.activeTextEditor.document.version;
      // the change event is fired before we can update the version of the last change by auto rename tag, therefore we wait for that
      await new Promise(resolve => setImmediate(resolve));
      if (
        lastChangeByAutoRenameTag.fsPath === event.document.uri.fsPath &&
        lastChangeByAutoRenameTag.version === event.document.version
      ) {
        previousText = currentText;
        return;
      }
      assertDefined(vscode.window.activeTextEditor);
      const afterVersion = vscode.window.activeTextEditor.document.version;
      if (beforeVersion !== afterVersion) {
        return;
      }
      previousText = currentText;
      doAutoCompletionElementRenameTag(languageClientProxy, tags);
    })
  );
};
