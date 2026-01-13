# WebScope Extension - Quick Reference

## 🚀 Getting Started

### Installation & Setup
```bash
cd /path/to/WebScope
npm install
```

### Run in Development
Press `F5` in VS Code to launch the extension development host.

### Build for Distribution
```bash
npm run compile
npm install -g @vscode/vsce
vsce package
```

---

## 📋 Command Reference

| Command | Trigger | Action |
|---------|---------|--------|
| `webscope.openWebPreview` | Cmd/Ctrl+Shift+P | Opens URL input dialog |
| `webscope.previewCurrentFile` | Cmd/Ctrl+Shift+P | Previews active HTML file |

---

## 🎛️ Toolbar Controls

| Button | Function | Shortcut |
|--------|----------|----------|
| **← Back** | Navigate to previous URL | Disabled at history start |
| **⟳ Reload** | Refresh current preview | F5 in iframe |
| **Load** | Load URL from input field | Enter key |
| **📁 Open File** | Browse for HTML file | File dialog |

---

## 📁 File Structure

```
WebScope/
├── src/
│   ├── extension.ts          ← Main extension logic (1000+ lines)
│   └── vscode.d.ts           ← Type definitions
├── package.json              ← Extension manifest & config
├── tsconfig.json             ← TypeScript config
├── .eslintrc.json            ← Linting rules
├── .gitignore                ← Git ignore rules
├── .vscodeignore             ← Package ignore rules
├── README.md                 ← User documentation
├── DEVELOPMENT.md            ← Developer guide
├── IMPLEMENTATION_GUIDE.md   ← Technical deep-dive
├── example.html              ← Example preview file
└── media/                    ← Static assets (empty)
```

---

## 🔧 Key Functions in extension.ts

### Command Handlers
- **`openWebPreview()`** - URL input dialog → webview creation
- **`previewCurrentFile()`** - HTML file validation → preview

### Content Management
- **`updateWebviewContent()`** - Handles file paths vs URLs
- **`getWebviewHtml()`** - Generates complete webview HTML
- **`escapeHtml()`** - XSS prevention

### Message Handling
- **`handleWebviewMessage()`** - Routes webview messages
- **`openFileDialog()`** - File browser dialog

### Utilities
- **`activate()`** - Extension initialization
- **`deactivate()`** - Extension cleanup

---

## 💬 Message Protocol

### From Webview → Extension
```javascript
// Load URL
vscode.postMessage({ command: 'updateUrl', url: 'http://...' });

// Open file dialog
vscode.postMessage({ command: 'openFileDialog' });

// Show error in extension
vscode.postMessage({ command: 'showError', message: 'Error text' });

// Log message
vscode.postMessage({ command: 'log', message: 'Debug info' });
```

### From Extension → Webview (via panel.webview.postMessage)
```typescript
// Can send messages to webview for dynamic updates
panel.webview.postMessage({ command: 'loadUrl', url: 'http://...' });
```

---

## 🎨 HTML/CSS Structure in Webview

```html
<body>
  ├── .toolbar
  │   ├── #backBtn
  │   ├── #reloadBtn
  │   ├── .url-input-container
  │   │   ├── #urlInput
  │   │   └── #loadBtn
  │   └── #openFileBtn
  ├── #statusBar
  └── .preview-container
      ├── #previewFrame (iframe)
      └── #errorContainer
```

### CSS Variables (VS Code Theme)
```css
--vscode-editor-background
--vscode-editor-foreground
--vscode-button-background
--vscode-button-hoverBackground
--vscode-input-background
--vscode-focusBorder
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|-----------------|
| **XSS Prevention** | HTML escaping with `escapeHtml()` |
| **Sandbox Isolation** | IFrame sandbox attribute |
| **Resource Access** | Limited via `localResourceRoots` |
| **CSP** | Proper iframe permissions |
| **Input Validation** | URL/path validation before loading |

---

## 🐛 Debugging

### Enable Logs
Check the Debug Console in VS Code:
```
Ctrl+Shift+Y (Windows/Linux)
Cmd+Shift+Y (Mac)
```

### Console Output from Extension
```typescript
console.log('Message'); // Appears in Debug Console
```

### Set Breakpoints
Click line numbers in `src/extension.ts` to set breakpoints. Execution pauses when reached.

### Reload Extension
Press `Ctrl+R` in the development host to reload without restarting.

---

## 🌐 Supported URLs

| URL Type | Example | Support |
|----------|---------|---------|
| Local server | `http://localhost:3000` | ✅ Full |
| External HTTPS | `https://example.com` | ✅ Full |
| External HTTP | `http://example.com` | ✅ Full (CORS applies) |
| Local files | `/path/to/file.html` | ✅ Full (absolute paths) |
| Relative paths | `./file.html` | ✅ From editor context |
| Files with spaces | `/path/to/my file.html` | ✅ Supported |

---

## ⚙️ Configuration

### Webview Options (in createWebviewPanel)
```typescript
{
  enableScripts: true,           // JS execution
  enableForms: true,             // Form submission
  retainContextWhenHidden: true, // State persistence
  localResourceRoots: [...]      // File access paths
}
```

### Sandbox Permissions (iframe)
```
allow-same-origin       // Local file access
allow-scripts           // JavaScript execution
allow-forms             // Form submission
allow-popups            // Popup windows
allow-top-navigation    // Window navigation
allow-presentation      // Fullscreen API
```

---

## 📦 Dependencies

### VS Code API
- `vscode.window.createWebviewPanel()`
- `vscode.window.showInputBox()`
- `vscode.window.showErrorMessage()`
- `vscode.window.showOpenDialog()`
- `vscode.commands.registerCommand()`

### Node.js
- `path` - File path utilities
- `fs` - File system access

### TypeScript
- `@types/vscode` - Type definitions
- `@types/node` - Node.js types

---

## 🧪 Testing Scenarios

1. **Basic URL Loading**
   - Input: `http://localhost:3000`
   - Expected: Page loads in iframe

2. **File Preview**
   - Command: "Preview Current File"
   - Expected: Active HTML file renders

3. **Navigation**
   - Click links in preview
   - Expected: Navigate within iframe

4. **Back Button**
   - Visit 3 URLs
   - Click back twice
   - Expected: Back to first URL

5. **Error Handling**
   - Input: `http://invalid-url-12345.com`
   - Expected: Error message with details

6. **Panel Persistence**
   - Open preview
   - Switch to another editor tab
   - Switch back
   - Expected: Preview state maintained

---

## 🚦 Status Codes

| Status | Color | Example |
|--------|-------|---------|
| Success | Green | "Loaded: http://localhost:3000" |
| Loading | Blue | "Loading..." |
| Error | Red | "Failed to Load Preview" |
| Info | Gray | "Ready - Preview: ..." |

---

## 📝 Code Comments

The extension includes comprehensive comments explaining:
- Function purposes
- Parameter descriptions
- Implementation details
- Security considerations
- Event handling logic

Look for `/** ... */` comments throughout the code.

---

## 🔗 Useful Links

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [VS Code Theme Variables](https://code.visualstudio.com/docs/getstarted/theme-color-reference)

---

## 📚 Additional Documentation

- **README.md** - User guide and features
- **DEVELOPMENT.md** - Developer quick start
- **IMPLEMENTATION_GUIDE.md** - Technical architecture deep-dive
- **example.html** - Interactive example page

---

## ✅ Pre-Flight Checklist

Before publishing:
- [ ] Code compiles without errors: `npm run compile`
- [ ] Linting passes: `npm run lint`
- [ ] All commands work as expected
- [ ] Error handling covers edge cases
- [ ] Panel properly disposes on close
- [ ] Resources cleaned up in subscriptions
- [ ] Keyboard shortcuts are unique
- [ ] Extension activates correctly
- [ ] Webview renders properly
- [ ] Back button state management works

---

## 🎯 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Extension not found" | Check activationEvents in package.json |
| Blank webview | Verify `enableScripts: true` in panel options |
| "Cannot read file" | Add directory to localResourceRoots |
| CORS error | External sites with CORS headers may block |
| Back button always enabled | Check history index management |
| Panel doesn't persist state | Verify `retainContextWhenHidden: true` |
| Webview not visible | Check viewColumn is Beside or appropriate |

---

## 📞 Support

For issues:
1. Check the Implementation Guide for technical details
2. Review the code comments for explanations
3. Check VS Code Extension API documentation
4. Enable debug console and check for error messages
