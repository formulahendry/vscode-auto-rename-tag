"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as testUtil from './testUtil';


// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {

    test("Insert at opening tag", function (done) {
        testUtil.insertAtPosition("<div></div>", "0", new vscode.Position(0, 4), "<div0></div0>", done);
    });

    test("Insert at closing tag", function (done) {
        testUtil.insertAtPosition("<div></div>", "1", new vscode.Position(0, 10), "<div1></div1>", done);
    });
});