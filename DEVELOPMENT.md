# WebScope Extension Quick Start

## Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Open in VS Code:**
   - Open this folder in VS Code

3. **Run the extension:**
   - Press `F5` or go to Run > Start Debugging
   - A new VS Code window will open with the extension loaded

4. **Test the commands:**
   - Open Command Palette (`Cmd+Shift+P` on Mac / `Ctrl+Shift+P` on Windows/Linux)
   - Type "WebScope: Open Web Preview"
   - Enter a URL (e.g., `http://localhost:3000`)
   - The preview will open in a panel

## Testing Scenarios

### Test 1: Load a Local URL
- Command: "WebScope: Open Web Preview"
- Input: `http://localhost:3000`
- Expected: Preview panel opens and loads the local server

### Test 2: Load a Local HTML File
- Command: "WebScope: Open Web Preview"
- Input: `/path/to/file.html` or use the file dialog
- Expected: HTML file is rendered in the preview

### Test 3: Navigation
- Load a page with multiple links
- Click links within the iframe
- Click the back button
- Expected: Navigation works and back button is disabled when at history start

### Test 4: Reload
- Load any URL
- Click reload button
- Expected: Page reloads in the iframe

### Test 5: Current File Preview
- Open an HTML file in the editor
- Command: "WebScope: Preview Current File"
- Expected: HTML file is previewed in a panel

## Package the Extension

```bash
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file that can be shared and installed.

## Debugging Tips

- **Console Logs**: Check the Debug Console in VS Code (Ctrl+Shift+Y)
- **Message Posting**: Use `vscode.postMessage()` in webview to communicate with extension
- **Breakpoints**: Set breakpoints in `src/extension.ts` and they will pause execution
- **Reload Extension**: Press Ctrl+R in the development host to reload

## Helpful Links

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
