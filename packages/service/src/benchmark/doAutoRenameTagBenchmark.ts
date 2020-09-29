import * as fs from 'fs';
import * as path from 'path';
import { doAutoRenameTag } from '../doAutoRenameTag';
import { isSelfClosingTagInLanguage } from '../isSelfClosingTag';
import { getMatchingTagPairs } from '../getMatchingTagPairs';

const file = fs
  .readFileSync(path.join(__dirname, '../../src/benchmark/file.txt'))
  .toString();

const measure: any = (name: string, fn: any, runs: number) => {
  const NS_PER_MS = 1e6;
  const NS_PER_SEC = 1e9;
  const start = process.hrtime();
  for (let i = 0; i < runs; i++) {
    fn();
  }
  console.log(runs + ' runs');
  const elapsedTime = process.hrtime(start);
  const elapsedTimeMs =
    (elapsedTime[0] * NS_PER_SEC + elapsedTime[1]) / NS_PER_MS / runs;
  console.log(name + ' took ' + elapsedTimeMs + 'ms');
};

measure(
  'rename',
  () => {
    doAutoRenameTag(file, 0, '<htmll', '<html', 'html');
  },
  10
); //?

measure(
  'nothing',
  () => {
    const whitespaceSet = new Set([' ', '\n', '\t', '\r', '\f']);
    let whitespaceCount = 0;
    for (let i = 0; i < file.length; i++) {
      const j = file[i];
      if (whitespaceSet.has(j)) {
        whitespaceCount++;
      }
    }
  },
  10
); //?
