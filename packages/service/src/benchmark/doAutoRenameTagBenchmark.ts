import * as fs from 'fs';
import * as path from 'path';
import { doAutoRenameTag } from '../doAutoRenameTag';
import { isSelfClosingTagInLanguage } from '../isSelfClosingTag';
import { getMatchingTagPairs } from '../getMatchingTagPairs';

const file = fs
  .readFileSync(path.join(__dirname, '../../src/benchmark/file.txt'))
  .toString();

const measure: any = (fn: any, runs: number) => {
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
  console.log('took ' + elapsedTimeMs + 'ms');
};

measure(() => {
  doAutoRenameTag(
    file,
    0,
    '<htmll',
    '<html',
    getMatchingTagPairs('html'),
    isSelfClosingTagInLanguage('html')
  );
}, 10); //?

console.log();
