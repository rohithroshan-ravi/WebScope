# WebScope Extension - Complete Implementation Guide

## Project Overview

WebScope is a full-featured VS Code extension that provides an in-editor web browser and preview tool. It allows developers to preview URLs, local HTML files, and web content directly within VS Code with a complete toolbar interface.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Editor                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        WebScope Webview Panel (Extension)            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │        Toolbar with Controls                   │  │   │
│  │  │  [Back] [Reload] [URL Input] [Load] [Open]   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │          Status Bar (Feedback)                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │                                                 │  │   │
│  │  │   <iframe> - Content Preview Area              │  │   │
│  │  │   (Renders URLs or Local HTML Files)           │  │   │
│  │  │                                                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │ Commands                          │ Messages
         │                                    │
  ┌──────┴──────────────┐          ┌─────────┴────────────┐
  │  Command Handler    │          │  Webview Message     │
  │  (extension.ts)     │          │  Handler             │
  └─────────────────────┘          └──────────────────────┘
```

## File Structure & Explanation

### `package.json`
**Purpose:** Extension metadata and VS Code configuration

**Key Sections:**
- **name/displayName/version**: Extension identity
- **engines**: Minimum VS Code version requirement (1.74.0)
- **main**: Entry point (`out/extension.js` after compilation)
- **contributes**: VS Code integration points
  - `commands`: Registering "Open Web Preview" and "Preview Current File"
  - `keybindings`: Optional keyboard shortcuts
- **activationEvents**: When the extension loads (on command trigger)
- **scripts**: Build and compilation commands

### `tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Key Settings:**
- **target**: ES2020 (modern JavaScript features)
- **module**: commonjs (required for Node.js/VS Code)
- **outDir**: Compiled JS goes to `./out/`
- **strict**: Enable strict type checking
- **lib**: Include ES2020 standard library

### `src/extension.ts`
**Purpose:** Main extension logic and command handlers

**Key Components:**

1. **`activate(context)`**
   - Called when the extension is activated
   - Registers command handlers
   - Manages subscriptions for memory cleanup

2. **`openWebPreview(context)`**
   - Shows input dialog for URL entry
   - Creates or focuses the webview panel
   - Configures sandbox and message handlers
   - Calls `updateWebviewContent()` to load content

3. **`previewCurrentFile(context)`**
   - Gets the active editor's document
   - Validates it's an HTML file
   - Converts file path to webview URI
   - Loads in the preview panel

4. **`updateWebviewContent(panel, urlOrPath, context)`**
   - Detects if input is file path or URL
   - For files: converts to webview URI using `asWebviewUri()`
   - For URLs: uses directly
   - Updates panel title
   - Generates and sets webview HTML

5. **`handleWebviewMessage(message, context)`**
   - Processes messages from webview
   - Handles: URL updates, file dialogs, errors, logging
   - Can trigger commands back to the webview

6. **`openFileDialog(context)`**
   - Shows file picker dialog
   - Filters for HTML files
   - Updates webview with selected file

7. **`getWebviewHtml(initialUrl)`**
   - Generates the complete HTML for the webview
   - Includes inline CSS and JavaScript
   - Creates the entire UI in one HTML document
   - Configures CSP (Content Security Policy)

### `getWebviewHtml()` - Detailed Breakdown

#### HTML Structure:

```html
<toolbar>
  - Back Button (navigates history)
  - Reload Button (refreshes iframe)
  - URL Input Field (for entering URLs/paths)
  - Load Button (loads the URL)
  - Open File Button (file dialog)
</toolbar>

<status-bar>
  - Shows loading/success/error messages
  - Auto-hides after success
</status-bar>

<preview-container>
  <iframe sandbox="..."> (displays content)
  <error-container> (error messages)
</preview-container>
```

#### CSS Features:

- **VS Code Theme Integration**: Uses CSS variables like `--vscode-button-background`
- **Responsive Design**: Flexbox layout that adapts to panel size
- **Dark/Light Mode**: Automatically adapts to editor theme
- **Animations**: Smooth transitions and loading spinner

#### JavaScript Features:

1. **History Management**:
   ```typescript
   history: string[]     // Array of visited URLs
   historyIndex: number  // Current position in history
   ```

2. **URL Loading**:
   - Validates input before loading
   - Updates history stack
   - Manages back button state
   - Handles errors gracefully

3. **Navigation**:
   - Back button moves through history
   - Reload uses `contentWindow.location.reload()`
   - Enter key triggers load

4. **Event Handling**:
   - `load` event: Success message, show iframe
   - `error` event: Display error container
   - `keypress`: Enter to load URL

5. **Status Messages**:
   - Loading: "Loading..."
   - Success: "Loaded: [URL]" (auto-hides)
   - Error: "Error loading preview"

### Supporting Files

#### `.eslintrc.json`
- Linting rules for TypeScript code
- Enforces code quality and consistency

#### `.vscodeignore`
- Excludes files when packaging extension
- Reduces package size

#### `.gitignore`
- Standard Node.js ignores
- Excludes build outputs and dependencies

#### `DEVELOPMENT.md`
- Quick start guide for developers
- Testing scenarios
- Debugging tips

#### `example.html`
- Sample HTML file for testing
- Demonstrates extension capabilities
- Interactive examples

## Key Technical Concepts

### 1. Webview Panel Creation

```typescript
const panel = vscode.window.createWebviewPanel(
  'webscope-preview',           // Internal ID
  'WebScope Preview',            // Display name
  vscode.ViewColumn.Beside,      // Where to open
  {
    enableScripts: true,         // Allow JS execution
    enableForms: true,           // Allow form submission
    retainContextWhenHidden: true, // Keep state when hidden
    localResourceRoots: [...]    // Allowed resource paths
  }
);
```

### 2. Local File Access

For security, webview can only access files in `localResourceRoots`:

```typescript
localResourceRoots: [
  vscode.Uri.file(path.join(context.extensionPath, 'media')),
  vscode.Uri.file(path.dirname(filePath)) // Parent directory of file
]
```

To use local files in webview:
```typescript
const webviewUri = panel.webview.asWebviewUri(fileUri);
```

### 3. IFrame Sandbox

The sandbox attribute restricts what the iframe can do:

```html
sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-presentation"
```

**Permissions Granted:**
- `allow-same-origin`: Access to local file resources
- `allow-scripts`: Execute JavaScript
- `allow-forms`: Submit forms
- `allow-popups`: Open popups
- `allow-top-navigation`: Navigate top window
- `allow-presentation`: Fullscreen API

**Restrictions (not granted):**
- No plugin execution
- No payment request API
- No sensor access
- Cross-origin isolation

### 4. Message Protocol

Extension and webview communicate via messages:

```typescript
// Webview → Extension
vscode.postMessage({ command: 'updateUrl', url: 'https://...' });

// Extension → Webview (not directly used in current implementation)
panel.webview.postMessage({ command: 'loadUrl', url: 'https://...' });
```

### 5. Resource Cleanup

The extension properly cleans up when disposed:

```typescript
panel.onDidDispose(() => {
  webPreviewPanel = undefined; // Clear reference
}, null, context.subscriptions);
```

## How It Works - Step by Step

### Opening a URL Preview

1. **User Action**: Runs "WebScope: Open Web Preview" command
2. **Input Dialog**: Extension shows input dialog with placeholder
3. **Create Panel**: If no panel exists, creates new webview panel
4. **Load Content**: Generates HTML with URL in iframe src
5. **Display**: Panel appears in editor
6. **User Interaction**: 
   - Navigates within iframe (auto-tracked)
   - Clicks back button (history navigation)
   - Enters new URL (loads in iframe)
   - Clicks reload (refreshes)

### Previewing Current File

1. **User Action**: Runs "WebScope: Preview Current File"
2. **Validation**: Checks if active file is HTML
3. **Path Conversion**: Converts file path to webview URI
4. **Panel Creation**: Creates webview with correct resource roots
5. **Load File**: Sets iframe src to webview URI of file
6. **Display**: File renders in preview panel

### Error Handling

1. **Error Occurs**: Iframe fails to load
2. **Event Fires**: `error` event on iframe
3. **Handler Executes**: Shows error container
4. **User Feedback**: Error message displayed with details
5. **Extension Log**: Error sent to extension console

## Performance Considerations

1. **Panel Reuse**: Only one panel per window (efficiency)
2. **State Retention**: `retainContextWhenHidden: true` preserves state
3. **History Tracking**: Simple array-based history (low memory)
4. **Message Handling**: Minimal message overhead

## Security Considerations

1. **XSS Prevention**: HTML escape special characters
2. **Sandbox Isolation**: IFrame prevents malicious scripts
3. **CSP Headers**: Proper Content Security Policy
4. **File Access**: Limited to specified directories
5. **URL Validation**: Input validation before loading

## Extensibility

The architecture allows for future enhancements:

1. **Additional Commands**: Register new commands in `package.json`
2. **New Toolbar Buttons**: Add buttons in webview HTML
3. **Enhanced Features**: Add JavaScript handlers in webview
4. **Theme Support**: Already using VS Code theme variables
5. **Settings**: Can add extension settings in `package.json`

## Testing Checklist

- [ ] Open with localhost URL
- [ ] Open with external URL
- [ ] Open with local HTML file
- [ ] Navigate with back button
- [ ] Reload current page
- [ ] File dialog opens and selects file
- [ ] Error message displays for invalid URL
- [ ] Panel state persists when switching tabs
- [ ] Multiple instances (panel only opens once)
- [ ] Close and reopen works

## Building and Distribution

### Compile:
```bash
npm run compile
```

### Package:
```bash
npm install -g @vscode/vsce
vsce package
```

### Result: `webscope-1.0.0.vsix`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not loading | Check `activationEvents` in package.json |
| Webview not showing | Verify `enableScripts: true` in panel options |
| Files not accessible | Add directory to `localResourceRoots` |
| CORS errors | Browser CORS applies to external URLs |
| Blank preview | Check iframe src URL is correctly formatted |
| Back button stuck | Ensure history array is properly managed |

## Conclusion

WebScope demonstrates best practices for VS Code extension development:
- Proper state management
- Clean architecture
- Security considerations
- User-friendly error handling
- Professional UI integration
- Comprehensive documentation

The extension is production-ready and can be extended with additional features as needed.
