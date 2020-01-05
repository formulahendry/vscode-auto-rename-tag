import { AssertionError } from "assert";
import "source-map-support/register";
import * as vscode from "vscode";
import {
  RequestType,
  TextDocumentIdentifier,
  LanguageClientOptions
} from "vscode-languageclient";
import {
  createLanguageClientProxy,
  LanguageClientProxy
} from "./createLanguageClientProxy";

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
  "$/auto-rename-tag"
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
  fsPath: "",
  version: -1
};

const applyResults: (results: Result[]) => Promise<void> = async results => {
  // console.log('apply ' + results.length + ' results')
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
    // console.log('not applied')
    // console.log(prev, next)
    // console.log(JSON.stringify(results))
    return;
    // throw new Error('not applied')
  }
  if (prev + 1 !== next) {
    // console.log(prev, next)
    // console.log(JSON.stringify(results))
    // console.log('return 3')
    // console.log('applied' + applied)
    // throw new Error()
    return;
  }

  for (const result of results) {
    // console.log(JSON.stringify(result))
    // if (!result) {
    //   console.error('no result client')
    //   continue
    // }
    // console.log(typeof result)
    // console.log('(1) set old word to ' + result.originalWord)
    const oldWordAtOffset = wordsAtOffsets[result.originalOffset];
    delete wordsAtOffsets[result.originalOffset];

    let moved = 0;
    if (result.originalWord.startsWith("</")) {
      moved = result.endOffset - result.startOffset + 2;
    }
    // console.log('set')
    // const newLength = result.originalWord.length
    wordsAtOffsets[result.originalOffset + moved] = {
      newWord: oldWordAtOffset && oldWordAtOffset.newWord,
      oldWord: result.originalWord
    };
    // console.log('moved ' + moved)
    // console.log(JSON.stringify(wordsAtOffsets))
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
    // console.log('(2) set old word to ' + tag.oldWord)
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
    // console.log('(2) get old word ' + tag.oldWord)
  }
  // console.log(JSON.stringify(wordsAtOffsets))
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
    // console.log(JSON.stringify(wordsAtOffsets))
    wordsAtOffsets = {};
    // process.exit(1)
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
        scheme: "file"
      },
      {
        scheme: "untitled"
      }
    ]
  };
  const languageClientProxy = await createLanguageClientProxy(
    context,
    "auto-rename-tag",
    "Auto Rename Tag",
    clientOptions
  );
  setPreviousText(vscode.window.activeTextEditor);
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(setPreviousText)
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async event => {
      const currentText = event.document.getText();
      if (!isEnabledLanguageId(event.document.languageId)) {
        return;
      }
      if (event.contentChanges.length === 0) {
        return;
      }
      // console.time('get tags')
      const tags: Tag[] = [];
      let totalInserted = 0;
      const sortedChanges = event.contentChanges
        .slice()
        .sort((a, b) => a.rangeOffset - b.rangeOffset);
      const keys = Object.keys(wordsAtOffsets);
      // console.log('-------------------------------------')
      for (const change of sortedChanges) {
        for (const key of keys) {
          const parsedKey = parseInt(key, 10);
          if (
            change.rangeOffset <= parsedKey &&
            parsedKey <= change.rangeOffset + change.rangeLength
          ) {
            // console.log('delete' + key)
            delete wordsAtOffsets[key];
          }
        }
        assertDefined(previousText);
        // console.log(JSON.stringify(wordsAtOffsets))
        // console.log('total insert' + totalInserted)
        const line = event.document.lineAt(change.range.start.line);
        const lineStart = event.document.offsetAt(line.range.start);
        const lineChangeOffset = change.rangeOffset - lineStart;
        const lineLeft = line.text.slice(0, lineChangeOffset + totalInserted);
        const lineRight = line.text.slice(lineChangeOffset + totalInserted);
        const lineTagNameLeft = lineLeft.match(tagNameReLeft);
        const lineTagNameRight = lineRight.match(tagNameRERight);
        const previousTextRight = previousText.slice(change.rangeOffset);
        const previousTagNameRight = previousTextRight.match(tagNameRERight);

        // console.log(lineTagNameLeft)
        // console.log(lineTagNameRight)

        // console.log(previousTagNameRight)
        // console.log(previousText)
        let newWord: string;
        let oldWord: string;

        if (!lineTagNameLeft) {
          // console.log('continue')
          totalInserted += change.text.length - change.rangeLength;
          continue;
        }
        newWord = lineTagNameLeft[0];
        oldWord = lineTagNameLeft[0];
        // console.log('new' + newWord)
        if (lineTagNameRight) {
          newWord += lineTagNameRight[0];
        }
        if (previousTagNameRight) {
          oldWord += previousTagNameRight[0];
        }

        const offset =
          change.rangeOffset - lineTagNameLeft[0].length + totalInserted;
        // console.log('new word' + newWord)
        // console.log('old word' + oldWord)
        // console.log('offset' + offset)
        tags.push({
          oldWord,
          word: newWord,
          offset,
          previousOffset: offset - totalInserted
        });
        totalInserted += change.text.length - change.rangeLength;
      }
      // console.log('tags')
      // console.log(JSON.stringify(tags))
      // console.log('\n')
      // console.log(JSON.stringify(wordsAtOffsets))
      // console.timeEnd('get tags')
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
        // console.log('return 3')
        return;
      }
      assertDefined(vscode.window.activeTextEditor);
      const afterVersion = vscode.window.activeTextEditor.document.version;
      if (beforeVersion !== afterVersion) {
        // previousText = event.document.getText()
        // console.log('return 1')
        // console.log(event.contentChanges)
        return;
      }
      // console.log('-----------------------------------')

      // console.log(
      //   'change' + event.contentChanges[0] && event.contentChanges[0].text
      // )
      previousText = currentText;

      // console.log('changes and text')
      // console.log(event.contentChanges)
      // console.log(event.document.getText())
      doAutoCompletionElementRenameTag(languageClientProxy, tags);
      // previousText = activeTextEditor.document.getText()
    })
  );
};
