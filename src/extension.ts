import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * WebScope - VS Code Web Preview Extension
 * 
 * This extension provides an in-editor web browser panel that can:
 * - Load and preview URLs (http://localhost:3000, external URLs, etc.)
 * - Preview local HTML files
 * - Navigate with back/reload buttons
 * - Handle errors gracefully
 */

// Global reference to the webview panel (ensures only one panel at a time)
let webPreviewPanel: vscode.WebviewPanel | undefined;

/**
 * Extension activation - called when any of the registered commands are executed
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('WebScope extension activated');

	// Command 1: Open Web Preview with URL input
	const openWebPreviewCommand = vscode.commands.registerCommand(
		'webscope.openWebPreview',
		() => openWebPreview(context)
	);

	// Command 2: Preview the current file
	const previewCurrentFileCommand = vscode.commands.registerCommand(
		'webscope.previewCurrentFile',
		() => previewCurrentFile(context)
	);

	context.subscriptions.push(openWebPreviewCommand, previewCurrentFileCommand);
}

/**
 * Deactivate the extension
 */
export function deactivate() {
	console.log('WebScope extension deactivated');
}

/**
 * Open web preview with a user-provided URL
 */
async function openWebPreview(context: vscode.ExtensionContext) {
	// Show input dialog for URL entry
	const url = await vscode.window.showInputBox({
		placeHolder: 'Enter URL (e.g., http://localhost:3000, /path/to/file.html)',
		prompt: 'Enter a URL or file path to preview',
		value: 'http://localhost:3000'
	});

	if (!url) {
		return; // User cancelled
	}

	// Create or focus the webview panel
	if (webPreviewPanel) {
		webPreviewPanel.reveal(vscode.ViewColumn.Beside);
	} else {
		webPreviewPanel = vscode.window.createWebviewPanel(
			'webscope-preview',
			'WebScope Preview',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				enableForms: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
			}
		);

		// Handle panel disposal
		webPreviewPanel.onDidDispose(() => {
			webPreviewPanel = undefined;
		}, null, context.subscriptions);

		// Handle messages from webview
		webPreviewPanel.webview.onDidReceiveMessage(
			(message) => handleWebviewMessage(message, context),
			null,
			context.subscriptions
		);
	}

	// Load the webview HTML content
	updateWebviewContent(webPreviewPanel, url, context);
}

/**
 * Preview the currently open file (if it's an HTML file)
 */
async function previewCurrentFile(context: vscode.ExtensionContext) {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		vscode.window.showErrorMessage('No file is open');
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const fileName = path.basename(filePath);

	// Check if it's an HTML file
	if (!fileName.endsWith('.html')) {
		vscode.window.showWarningMessage('Current file is not an HTML file');
		return;
	}

	// Create or focus the webview panel
	if (webPreviewPanel) {
		webPreviewPanel.reveal(vscode.ViewColumn.Beside);
	} else {
		webPreviewPanel = vscode.window.createWebviewPanel(
			'webscope-preview',
			'WebScope Preview',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				enableForms: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(context.extensionPath, 'media')),
					vscode.Uri.file(path.dirname(filePath))
				]
			}
		);

		webPreviewPanel.onDidDispose(() => {
			webPreviewPanel = undefined;
		}, null, context.subscriptions);

		webPreviewPanel.webview.onDidReceiveMessage(
			(message) => handleWebviewMessage(message, context),
			null,
			context.subscriptions
		);
	}

	// Load the HTML file path as the preview URL
	updateWebviewContent(webPreviewPanel, filePath, context);
}

/**
 * Update webview content with the given URL
 */
function updateWebviewContent(
	panel: vscode.WebviewPanel,
	urlOrPath: string,
	context: vscode.ExtensionContext
) {
	// Determine if input is a file path or URL
	const isFilePath = !urlOrPath.startsWith('http://') && 
	                   !urlOrPath.startsWith('https://') &&
	                   (urlOrPath.startsWith('/') || urlOrPath.startsWith('.'));

	let displayUrl: string;

	if (isFilePath) {
		// Convert file path to webview URI
		const fileUri = vscode.Uri.file(urlOrPath);
		displayUrl = panel.webview.asWebviewUri(fileUri).toString();
		panel.title = `WebScope: ${path.basename(urlOrPath)}`;
	} else {
		// Use URL as-is
		displayUrl = urlOrPath;
		panel.title = `WebScope: ${urlOrPath}`;
	}

	// Generate and set webview HTML
	const html = getWebviewHtml(displayUrl);
	panel.webview.html = html;
}

/**
 * Handle messages from the webview
 */
function handleWebviewMessage(message: any, context: vscode.ExtensionContext) {
	switch (message.command) {
		case 'updateUrl':
			if (webPreviewPanel) {
				updateWebviewContent(webPreviewPanel, message.url, context);
			}
			break;

		case 'openFileDialog':
			openFileDialog(context);
			break;

		case 'showError':
			vscode.window.showErrorMessage(`Preview Error: ${message.message}`);
			break;

		case 'log':
			console.log('[WebScope]', message.message);
			break;
	}
}

/**
 * Open file dialog to select an HTML file
 */
async function openFileDialog(context: vscode.ExtensionContext) {
	const files = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		filters: {
			'Web Files': ['html', 'htm'],
			'All Files': ['*']
		}
	});

	if (files && files.length > 0) {
		const filePath = files[0].fsPath;
		if (webPreviewPanel) {
			updateWebviewContent(webPreviewPanel, filePath, context);
		}
	}
}

/**
 * Generate the HTML content for the webview
 * 
 * This includes:
 * - URL input bar with load button
 * - Navigation buttons (back, reload)
 * - IFrame for displaying content
 * - CSP (Content Security Policy) headers for safe iframe loading
 * - Event handlers for user interactions
 */
function getWebviewHtml(initialUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>WebScope Preview</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			display: flex;
			flex-direction: column;
			height: 100vh;
			background-color: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
		}

		/* Toolbar Container */
		.toolbar {
			display: flex;
			gap: 8px;
			padding: 10px;
			background-color: var(--vscode-activityBar-background);
			border-bottom: 1px solid var(--vscode-sideBar-border);
			flex-wrap: wrap;
			align-items: center;
		}

		/* Buttons */
		button {
			padding: 6px 12px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			transition: background-color 0.2s;
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		button:active {
			opacity: 0.8;
		}

		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* URL Input Section */
		.url-input-container {
			display: flex;
			gap: 8px;
			flex: 1;
			min-width: 250px;
		}

		input[type="text"] {
			flex: 1;
			padding: 6px 10px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-size: 13px;
			min-width: 150px;
		}

		input[type="text"]:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
			box-shadow: 0 0 0 1px var(--vscode-focusBorder);
		}

		/* Status/Info Bar */
		.status-bar {
			padding: 6px 10px;
			background-color: var(--vscode-editor-background);
			border-bottom: 1px solid var(--vscode-sideBar-border);
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}

		.status-bar.error {
			background-color: var(--vscode-inputValidation-errorBackground);
			color: var(--vscode-inputValidation-errorForeground);
			border-color: var(--vscode-inputValidation-errorBorder);
		}

		.status-bar.success {
			background-color: var(--vscode-inputValidation-successBackground);
			color: var(--vscode-inputValidation-successForeground);
			border-color: var(--vscode-inputValidation-successBorder);
		}

		.status-bar.loading {
			background-color: var(--vscode-inputValidation-infoBackground);
			color: var(--vscode-inputValidation-infoForeground);
			border-color: var(--vscode-inputValidation-infoBorder);
		}

		/* Preview Container */
		.preview-container {
			flex: 1;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		/* IFrame Styles */
		iframe {
			flex: 1;
			border: none;
			width: 100%;
			height: 100%;
			background-color: white;
		}

		/* Error Message */
		.error-container {
			display: none;
			flex: 1;
			overflow: auto;
			padding: 20px;
			background-color: white;
		}

		.error-container.show {
			display: block;
		}

		.error-message {
			background-color: #f8d7da;
			border: 1px solid #f5c6cb;
			border-radius: 4px;
			padding: 12px;
			color: #721c24;
			margin-bottom: 10px;
		}

		.error-details {
			background-color: #f5f5f5;
			border: 1px solid #ddd;
			border-radius: 4px;
			padding: 12px;
			font-family: 'Monaco', 'Courier New', monospace;
			font-size: 12px;
			white-space: pre-wrap;
			word-break: break-all;
			color: #333;
		}

		.spinner {
			display: inline-block;
			width: 14px;
			height: 14px;
			border: 2px solid rgba(255, 255, 255, 0.3);
			border-top-color: white;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin-right: 8px;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}
	</style>
</head>
<body>
	<!-- Toolbar -->
	<div class="toolbar">
		<button id="backBtn" title="Go Back">← Back</button>
		<button id="reloadBtn" title="Reload Page">⟳ Reload</button>
		<div class="url-input-container">
			<input 
				type="text" 
				id="urlInput" 
				placeholder="Enter URL or file path..."
				value="${escapeHtml(initialUrl)}"
			/>
			<button id="loadBtn" title="Load URL">Load</button>
		</div>
		<button id="openFileBtn" title="Open HTML File">📁 Open File</button>
	</div>

	<!-- Status Bar -->
	<div id="statusBar" class="status-bar"></div>

	<!-- Preview Container -->
	<div class="preview-container">
		<iframe 
			id="previewFrame" 
			sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-presentation"
			src="${escapeHtml(initialUrl)}"
		></iframe>
		<div id="errorContainer" class="error-container"></div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		const urlInput = document.getElementById('urlInput');
		const loadBtn = document.getElementById('loadBtn');
		const backBtn = document.getElementById('backBtn');
		const reloadBtn = document.getElementById('reloadBtn');
		const openFileBtn = document.getElementById('openFileBtn');
		const previewFrame = document.getElementById('previewFrame');
		const errorContainer = document.getElementById('errorContainer');
		const statusBar = document.getElementById('statusBar');

		// History stack for back button
		let history = ['${escapeHtml(initialUrl)}'];
		let historyIndex = 0;

		/**
		 * Load a URL in the iframe
		 */
		function loadUrl(url) {
			if (!url.trim()) {
				showStatus('Please enter a URL or file path', 'error');
				return;
			}

			showStatus('Loading...', 'loading');
			errorContainer.classList.remove('show');

			// Add to history if it's a new URL
			if (historyIndex < history.length - 1) {
				history = history.slice(0, historyIndex + 1);
			}
			if (url !== history[historyIndex]) {
				history.push(url);
				historyIndex++;
			}

			// Update UI state
			updateBackButtonState();

			try {
				previewFrame.src = url;
				vscode.postMessage({
					command: 'updateUrl',
					url: url
				});
			} catch (error) {
				showError('Failed to load URL', error.message);
			}
		}

		/**
		 * Go back in history
		 */
		function goBack() {
			if (historyIndex > 0) {
				historyIndex--;
				previewFrame.src = history[historyIndex];
				urlInput.value = history[historyIndex];
				updateBackButtonState();
				showStatus('Navigated back', 'success');
			}
		}

		/**
		 * Reload the current page
		 */
		function reload() {
			previewFrame.contentWindow.location.reload();
			showStatus('Reloading...', 'loading');
		}

		/**
		 * Update back button disabled state
		 */
		function updateBackButtonState() {
			backBtn.disabled = historyIndex <= 0;
		}

		/**
		 * Show status message
		 */
		function showStatus(message, type = 'info') {
			statusBar.textContent = message;
			statusBar.className = 'status-bar ' + type;
			if (type === 'success') {
				setTimeout(() => {
					statusBar.textContent = '';
					statusBar.className = 'status-bar';
				}, 3000);
			}
		}

		/**
		 * Show error message
		 */
		function showError(title, details) {
			errorContainer.innerHTML = \`
				<div class="error-message">\${title}</div>
				<div class="error-details">\${escapeHtmlContent(details)}</div>
			\`;
			errorContainer.classList.add('show');
			previewFrame.style.display = 'none';
			showStatus('Error loading preview', 'error');

			vscode.postMessage({
				command: 'showError',
				message: title + ': ' + details
			});
		}

		/**
		 * Escape HTML special characters
		 */
		function escapeHtmlContent(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		}

		// Event Listeners
		loadBtn.addEventListener('click', () => {
			loadUrl(urlInput.value);
		});

		urlInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				loadUrl(urlInput.value);
			}
		});

		backBtn.addEventListener('click', goBack);
		reloadBtn.addEventListener('click', reload);

		openFileBtn.addEventListener('click', () => {
			vscode.postMessage({ command: 'openFileDialog' });
		});

		// Handle iframe load events
		previewFrame.addEventListener('load', () => {
			errorContainer.classList.remove('show');
			previewFrame.style.display = 'block';
			showStatus(\`Loaded: \${urlInput.value}\`, 'success');
		});

		previewFrame.addEventListener('error', (e) => {
			showError(
				'Failed to Load Preview',
				'The URL or file could not be loaded. Make sure the URL is accessible or the file path is correct.\\n\\nURL/Path: ' + urlInput.value
			);
			previewFrame.style.display = 'none';
		});

		// Sync URL input when user navigates within iframe
		previewFrame.addEventListener('load', () => {
			try {
				// Note: Due to sandbox restrictions, this may not work for cross-origin
				const iframeUrl = previewFrame.contentWindow.location.href;
				urlInput.value = iframeUrl;
			} catch (e) {
				// Expected for cross-origin iframes
			}
		});

		// Initialize
		updateBackButtonState();
		showStatus(\`Ready - Preview: \${urlInput.value}\`, 'success');

		// Handle messages from extension
		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message.command === 'loadUrl') {
				loadUrl(message.url);
			}
		});
	</script>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
	const map: { [key: string]: string } = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}
