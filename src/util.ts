"use strict";
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/*
js写法
const fs = require('fs');
const os = require('os');
const path = require('path');
// const vscode = require("vscode");const util = {
    getExtensionFileAbsolutePath: function (context: vscode.ExtensionContext, relativePath:string) {
        return path.join(context.extensionPath, relativePath);
    },
}
module.exports = util;
*/

export class util {

    public static merge(obj1: any, obj2: any) {
        if (obj1 === obj2) return;
        if (!obj1 || !util.isJsonObject(obj1)) return;
        if (!obj2 || !util.isJsonObject(obj2)) return;
        // 如果是从配置中取来的的对象，它有代理，所以与简单的javascript json对象不同，多了些东西
        obj2 = JSON.parse(JSON.stringify(obj2))  //obj2改成简单Json对象
        for (const key of Object.keys(obj2)) {
            if (!obj2[key]) continue;
            if (key === "__proto__" || typeof (obj2[key]) === "function") continue;

            if (!obj1[key] || !util.isJsonObject(obj1[key])) {
                obj1[key] = obj2[key];
            }
            else util.merge(obj1[key], obj2[key]); //递归
        }
    }

    public static isJsonObject(obj: any) {
        return obj
            && typeof (obj) == "object"
            && Object.prototype.toString.call(obj).toLowerCase() == "[object object]"
            && !obj.length;
    }

    public static getRandomFileName() {
        const tmpdir = os.tmpdir();
        const randName = Math.random().toString().replace(/[^0-9]+/g, "");
        return path.join(tmpdir, "_p2f_" + randName);
    }

    public static sleep(time = 0) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        })
    }

    public static showMessage(msg:string){
        vscode.window.showInformationMessage(msg);
    }
    public static showError(msg:string){
        vscode.window.showErrorMessage(msg);
    }

    // 参考 https://github.com/zhouhangzooo/test/
    public static getExtensionFileAbsolutePath(context: vscode.ExtensionContext, relativePath: string) {
        return path.join(context.extensionPath, relativePath);
    }



    // 参考 https://github.com/formulahendry/vscode-code-runner

    public static async getPythonPath(document: vscode.TextDocument): Promise<string> {
        const PYTHON = "python";
        try {
            const extension = vscode.extensions.getExtension("ms-python.python");
            if (!extension) {
                return PYTHON;
            }
            const usingNewInterpreterStorage = extension.packageJSON?.featureFlags?.usingNewInterpreterStorage;
            if (usingNewInterpreterStorage) {
                if (!extension.isActive) {
                    await extension.activate();
                }
                const execCommand = extension.exports.settings.getExecutionDetails ?
                    extension.exports.settings.getExecutionDetails(document?.uri).execCommand :
                    extension.exports.settings.getExecutionCommand(document?.uri);
                return execCommand ? execCommand.join(" ") : PYTHON;
            } else {
                return util.getConfiguration("python", document).get<string>("pythonPath") || "";
            }
        } catch (error) {
            return PYTHON;
        }
    }

    public static getConfiguration(section?: string, document?: vscode.TextDocument): vscode.WorkspaceConfiguration {
        if (document) {
            return vscode.workspace.getConfiguration(section, document.uri);
        } else {
            return vscode.workspace.getConfiguration(section);
        }
    }

}