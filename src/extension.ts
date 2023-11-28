// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getPageHtml, getDefaultStyle, getDefaultStyleForDark } from './constants';
import { util } from './util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
//const exec = require('child_process').exec
import {exec} from 'child_process';

exec('git config --global user.name', (err, stdout, stderr) => console.log(stdout))


//const util = require('./util');
//const fs = require('fs');
//const path = require('path');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, extension "py2flowchart" is now active!');
	//console.log(util.getPythonPath(undefined));


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('py2flowchart.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		util.showMessage('Hello World from py2flowchart!');
	});

	context.subscriptions.push(disposable);

	// ========= 与web相关的代码 ==========
	// 参考：https://github.com/zhouhangzooo/test/blob/master/extension.js
	let panel: vscode.WebviewPanel;
	let panel_exists = false;
	let html_template = "";
	let python_path = "";
	let _document: vscode.TextDocument;
	let _languageId = "python";
	let _terminal: vscode.Terminal | null;

	let openFlowchartCmd =
		vscode.commands.registerCommand('py2flowchart.openFlowchart', async function (uri) {
			// 获取内容模板
			if (!html_template) {
				initTemplate();
			}

			// 获取python代码
			let pythonCode = getPythonCode();
			if (!pythonCode) {
				util.showError("no python code found");
				return;
			}

			// 获取python路径
			if (!python_path) {
				python_path = await util.getPythonPath(_document);
			}

			// 转成flowchartcode
			let flowchartCode: any = null;
			try {
				flowchartCode = await executePy2flowchart(pythonCode);
			}
			catch (err) {
			}
			if (!flowchartCode) {
				util.showError("error flowchart");
				return;
			}

			// 创建webview
			if (!panel_exists) {
				createCourseWebview(uri);
				panel_exists = true;
			}

			// 显示流程图
			showFlowchartCodeInWebview(flowchartCode);
		});

	context.subscriptions.push(openFlowchartCmd);


	function createCourseWebview(uri: string) {
		panel = vscode.window.createWebviewPanel(
			'flowchartWebview', "flowchart", vscode.ViewColumn.Two, {
			enableScripts: true,
			retainContextWhenHidden: true,
			enableFindWidget: true,
		});
	}

	async function executePy2flowchart(pycode: string): Promise<string | null> {
		// 参考 https://blog.csdn.net/yangxuan0261/article/details/84029331
		if (!_terminal) {
			_terminal = vscode.window.createTerminal("Py2flowchart");
		}

		//let doc =  vscode.window.activeTextEditor!.document;
		//let path = doc.uri.fsPath;
		//if (doc.languageId !== "python") return;

		// 写入临时文件
		const file = util.getRandomFileName();
		//如果用\n则在windows中有问题，后来改成os.EOL就可以了 2023-11-28
		fs.writeFileSync(file + ".py", "#coding:utf-8" + os.EOL + pycode, "utf-8"); 

		// 执行python语句进行转换
		// 注意 2023-11-28
		// 注意这里-c后面用换行符不行，试了\\n及\n都不行，后来改成分号（;）就可以了
		let cmd = '"' + python_path + '" -c ' +
			`"from py2flowchart import *;pyfile2flowchart(r'${file}.py', r'${file}.html')"`; 

		//util.showMessage(cmd);
		//_terminal.show(true);
		_terminal.sendText(cmd);

		// 取得结束
		let times = 20;
		while (!fs.existsSync(file + ".html")) {
			times--;
			if (times <= 0) break;
			await util.sleep(100);
		}
		if (times <= 0) {
			//util.showMessage("times <= 0");
			//2023-11-28 如果出问题，试图检查之
			try {
				let cmdCheck = '"' + python_path + '" -c ' + `"from py2flowchart import *;print(type(pyfile2flowchart))"`;
				exec(cmdCheck, (err, stdout, stderr) => {
					console.log(stdout);
					//util.showMessage(cmd); //'ModuleNotFoundError'
					if (err) {
						util.showMessage("Please pip install py2flowchart");
					}
				});
			}catch(ex){
				console.log(ex);
			}
			return null;
		}
	

		// 读取结果
		let htmlContent = fs.readFileSync(file + ".html", "utf-8");
		//util.showMessage(htmlContent);

		try {
			fs.unlink(file + ".py", () => { });
			fs.unlink(file + ".html", () => { });
		} catch (err) {
		}

		let reg = /\bcode\s*=\s*`([\s\S]*?)`/;
		let match = htmlContent.match(reg);
		if (match) return match[1];
		return null;
	}

	// 监听终端被关闭
	vscode.window.onDidCloseTerminal((terminal) => {
		if (terminal.name === "Py2flowchart") {
			_terminal = null;
		}
	});

	// 得到当前的文档
	function getDocument() {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			_document = editor.document;
			if (_document) {
				_languageId = _document.languageId;
			}
		}
	}

	// 得到文档的内容
	function getDocContent(): string {
		getDocument();
		if (!_document) return "";
		let selection;
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			selection = editor.selection;
		}
		if (!selection || selection.isEmpty)
			return _document.getText();
		return _document.getText(selection);
	}

	// 得到python内容
	function getPythonCode(): string {
		getDocument();
		if (!_document) return "";
		if (!_languageId || _languageId != "python") return "";
		return getDocContent();
	}

	// 显示内容
	function showFlowchartCodeInWebview(flowchartcode: string | null) {
		let html = html_template;

		let pythonCode = getPythonCode();

		// 置入flowchartcode
		if (!flowchartcode) flowchartcode = `st=>start: Start:>http://www.google.com[blank]
		e=>end:>http://www.google.com
		op1=>operation: My Operation
		sub1=>subroutine: My Subroutine
		cond=>condition: Yes or No?|past
		io=>inputoutput: catch something...
		para=>parallel: parallel tasks
		
		st->op1->cond
		cond(yes)->io->e
		cond(no)->para
		para(path1, bottom)->sub1(right)->op1
		para(path2, top)->op1`;


		html = html.replace("{flowchartcode}", flowchartcode);

		// 显示到页面中
		panel.webview.html = html;

		// 资源释放
		panel.onDidDispose(() => {
			panel_exists = false;
		}, null, context.subscriptions);
	}

	function initTemplate() {
		// 获取内容模板
		try {
			html_template = getTemplateWebPageContent(context, 'media/flowchart.js-hello-000.html');
		} catch (error) {
			html_template = getPageHtml();
			//let html_template = "```{flowchartcode}`"
		}
		//设置其中的颜色
		let style = getDefaultStyle();
		let style2 = vscode.workspace.getConfiguration("py2flowchart.style");
		if (vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.Dark){
			style = getDefaultStyleForDark();
			style2 = vscode.workspace.getConfiguration("py2flowchart.style.dark");
		}
		util.merge(style, style2);
		html_template = html_template.replace("{flowchartstyle}", JSON.stringify(style));

	}

	function getTemplateWebPageContent(context: vscode.ExtensionContext, templatePath: string): string {
		const resourcePath = util.getExtensionFileAbsolutePath(context, templatePath);
		const dirPath = path.dirname(resourcePath);
		let html = "";
		try {
			html = fs.readFileSync(resourcePath, 'utf-8');
		} catch (error) {
			console.log(error);
		}

		// 相对路径换成资源路径
		html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g,
			(m, $1: string, $2: string) => {
				if ($2.startsWith("http://") || $2.startsWith("https://")) {
					return m;
				}
				return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({
					scheme: 'vscode-resource'
				}).toString() + '"';
			});
		return html;
	}

}

// this method is called when your extension is deactivated
export function deactivate() { }
