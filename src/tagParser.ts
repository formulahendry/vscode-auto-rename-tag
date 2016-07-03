'use strict';

import * as parse from 'parse5';

interface StartPositions {
    [k: string]: parse.LocationInfo;
}

interface PairedTag {
    startOffset: number;
    endOffset: number;
};

export function findPairedTag(text: string, pos: number, startTag: string, endTag: string): PairedTag {
    const starts: StartPositions = {};
    let depth = 0;
    let startTagDepth = null;
    let pairedStartTag: PairedTag;
    let pairedEndTag: PairedTag;

    function inRange(pos: number, start: number, len: number): boolean {
        return (start + 1) <= pos && pos <= (start + len + 1);
    }

    function toNameDeoth(name: string) {
        return name + depth;
    }

    const parser = new parse.SAXParser({ locationInfo: true });
    parser.on('startTag', (name: string, attrs, selfClosing, location: parse.LocationInfo) => {
        starts[toNameDeoth(name)] = location;
        if (inRange(pos, location.startOffset, name.length)) {
            startTagDepth = depth;
        }
        depth++;
    });

    parser.on('endTag', (name: string, location: parse.LocationInfo) => {
        depth--;
        if (startTagDepth !== null && endTag === name && startTagDepth === depth) {
            pairedEndTag = { startOffset: location.startOffset + 2, endOffset: location.startOffset + 2 + endTag.length };
            parser.stop();
        } else if (inRange(pos, location.startOffset + 1, name.length)) {
            pairedStartTag = { startOffset: starts[toNameDeoth(startTag)].startOffset + 1, endOffset: starts[toNameDeoth(startTag)].startOffset + 1 + startTag.length };
            parser.stop();
        }
    });

    // Hack here to remove php tag to void conflict with HTML/XML tag
    text = text.replace("<?php", "??php").replace("?>", "??");
    parser.end(text);

    return pairedEndTag || pairedStartTag;
}