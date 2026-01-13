# WebScope - VS Code Web Preview

An in-editor web browser and preview tool for Visual Studio Code. Preview URLs, local HTML files, and web content directly in your editor with a full-featured toolbar and navigation controls.

## Features

✨ **Key Features:**
- 🌐 **URL Preview**: Load and preview any URL (http://localhost:3000, external URLs, etc.)
- 📄 **Local File Preview**: Preview local HTML files with full file system access
- ⬅️ **Navigation**: Back button with history tracking
- 🔄 **Reload**: Refresh the current preview
- 📁 **File Dialog**: Easily open HTML files to preview
- 🛡️ **Secure**: Proper Content Security Policy (CSP) handling for iframe usage
- 💾 **Panel State**: Maintains panel state when switching tabs
- ⚠️ **Error Handling**: Graceful error messages for failed loads

## Installation

1. Clone or download the extension folder
2. Open in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to open the extension development host
5. In the development host, use the commands below

## Usage

### Commands

- **WebScope: Open Web Preview** (`Cmd+Shift+P` on Mac / `Ctrl+Shift+P` on Windows/Linux)
  - Opens a dialog to enter a URL or file path
  - Supports:
    - Web URLs: `http://localhost:3000`, `https://example.com`
    - Local files: `/path/to/file.html`, `./popup.html`
    - File dialog picker

- **WebScope: Preview Current File** (`Cmd+Shift+P` on Mac)
  - Previews the currently open HTML file
  - Only works with `.html` and `.htm` files

### Toolbar

- **← Back**: Navigate to the previous URL in history
- **⟳ Reload**: Refresh the current preview
- **Load**: Load the URL entered in the input field
- **📁 Open File**: Open a file dialog to select an HTML file

## Extension Architecture

### File Structure

```
webscope/
├── src/
│   └── extension.ts          # Main extension logic
├── media/                    # Static assets (future use)
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
├── .vscodeignore             # Files to exclude from package
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

### Key Components

#### Extension File (`src/extension.ts`)

**Activation Events:**
- Triggered when either command is executed
- Sets up command handlers and webview message listeners

**Main Functions:**

1. **`activate()`**
   - Entry point for the extension
   - Registers commands: `openWebPreview` and `previewCurrentFile`
   - Manages subscriptions for cleanup

2. **`openWebPreview()`**
   - Shows an input dialog for URL entry
   - Creates or focuses the webview panel
   - Sets up event handlers

3. **`previewCurrentFile()`**
   - Validates that the current file is HTML
   - Converts file path to webview URI
   - Loads the file in the preview panel

4. **`updateWebviewContent()`**
   - Determines if input is a file path or URL
   - Generates HTML content for the webview
   - Updates the panel title

5. **`handleWebviewMessage()`**
   - Processes messages from the webview
   - Handles: URL updates, file dialogs, error messages, logging

#### Webview HTML/CSS/JavaScript

The webview is entirely self-contained in `getWebviewHtml()`:

**HTML Structure:**
- Toolbar with navigation and controls
- Status bar for feedback messages
- IFrame for content display
- Error container for error messages

**CSS:**
- VS Code theme variable integration (`--vscode-*`)
- Responsive layout with flexbox
- Smooth animations and transitions
- Dark/light mode support through theme variables

**JavaScript:**
- **History Management**: Maintains a history stack for back navigation
- **URL Loading**: Validates and loads URLs/file paths
- **Event Handling**: Listens for iframe events and user interactions
- **Status Messages**: Shows loading, success, and error states
- **Error Display**: Renders user-friendly error messages with details

### Message Protocol

**Extension → Webview:**
```typescript
{
  command: 'loadUrl',
  url: string
}
```

**Webview → Extension:**
```typescript
{
  command: 'updateUrl',
  url: string
}

{
  command: 'openFileDialog'
}

{
  command: 'showError',
  message: string
}

{
  command: 'log',
  message: string
}
```

## Technical Details

### Content Security Policy (CSP)

The webview uses a permissive sandbox configuration:
```html
<iframe 
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-presentation"
/>
```

**Permissions:**
- `allow-same-origin`: Access to local file system resources
- `allow-scripts`: Execute JavaScript in iframe
- `allow-forms`: Handle form submissions
- `allow-popups`: Allow popup windows
- `allow-top-navigation`: Allow navigation
- `allow-presentation`: Fullscreen support

### File Path Handling

- **Local Files**: Converted to webview URIs using `webview.asWebviewUri()`
- **URLs**: Used directly (http/https)
- **Relative Paths**: Can use `./` or absolute paths

### Error Handling

- Invalid URLs show user-friendly error messages
- Network errors are caught and displayed
- File not found errors are clearly communicated
- Console logging for debugging

## Development

### Setup

```bash
# Install dependencies
npm install

# Watch for TypeScript changes
npm run watch

# Compile TypeScript
npm run compile
```

### Debugging

1. Press `F5` in VS Code to launch the extension
2. A new VS Code window opens with the extension active
3. Set breakpoints in `src/extension.ts`
4. Use the Debug Console to see logs

### Building

```bash
# Compile for production
npm run compile

# Package as .vsix
npm install -g @vscode/vsce
vsce package
```

## Configuration

### Webview Options

To modify webview behavior, edit the `createWebviewPanel()` options:

```typescript
{
  enableScripts: true,           // Allow JavaScript execution
  enableForms: true,             // Allow form submissions
  retainContextWhenHidden: true, // Keep state when switching tabs
  localResourceRoots: [...]      // Allowed resource paths
}
```

## Limitations & Known Issues

1. **Cross-Origin Content**: External websites with CORS restrictions may not load properly
2. **Sandbox Restrictions**: Due to iframe sandbox, some JavaScript APIs are restricted
3. **Console Access**: Iframe console logs are not visible in the extension console
4. **Cookie Handling**: Cookies and local storage are isolated within the iframe

## Future Enhancements

- [ ] DevTools integration
- [ ] HTTP header customization
- [ ] Cookie/session management
- [ ] Download file support
- [ ] Screenshot/export functionality
- [ ] Responsive preview modes (mobile, tablet, desktop)
- [ ] Network inspection
- [ ] Console output viewer

## Contributing

Contributions are welcome! Please submit issues and pull requests.

## License

MIT

## Support

For issues and feature requests, please create an issue on the GitHub repository.
