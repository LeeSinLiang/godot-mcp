# Godot MCP Server

A MCP server for AI assistants (Claude Code, Cursor, Codex etc) to control and access Godot Engine: capturing errors in editor, managing scenes, and remote connections allowing real-time build and debug - synchronized with your Godot editor.

## Setup

### Step 1: Install godot-mcp (one-time)

```bash
git clone https://github.com/LeeSinLiang/godot-mcp.git ~/tools/godot-mcp
cd ~/tools/godot-mcp
npm install
npm run build
npm link
```

### Step 2: Configure your Godot project (per-project)

```bash
cd ~/my-games/your-godot-project
godot-mcp-init
```

The tool will:
1. Ask for your Godot executable path
2. Select which clients to configure (Claude Desktop, Claude Code, Cursor)
3. Create configuration files automatically

**That's it!** Start using AI assistance in Cursor or Claude Code.

## Features

- **Project Management**: Launch editor, run/stop projects, list/inspect Godot projects
- **Scene Editing**: Create scenes, add/configure nodes, load sprites, export mesh libraries
- **Remote Debugging (Recommended)**: Connect to Godot editor's remote debugger, capture real-time output while running in editor
- **Debug Output**: Get print statements, errors, and warnings from running projects
- **Cross-Platform**: Windows, macOS, Linux support

## Available MCP Tools

### Remote Debugging Workflow (Recommended)

Work seamlessly with the Godot editor while AI assists you:

1. **`connect_remote_debugger`** - Connect to Godot editor's remote debugger (default ports 6006/6007)
2. Press **F5** in Godot editor to run your project
3. **`get_remote_debug_output`** - Get real-time print statements, errors, and warnings
4. Make changes with AI assistance and test immediately in the editor

This workflow allows you to:
- Write code in Godot editor with syntax highlighting and autocomplete
- Run and debug with F5 while AI monitors output and suggests fixes
- No blind coding - see exactly what's happening in real-time

## All Available Tools

**Debug & Remote:** `connect_remote_debugger`, `get_remote_debug_output`, `disconnect_remote_debugger`, `get_debug_output`, `capture_screenshot`
**Project Management:** `launch_editor`, `run_project`, `stop_project`, `list_projects`, `get_project_info`, `get_godot_version`
**Scene Editing:** `create_scene`, `add_node`, `load_sprite`, `save_scene`, `export_mesh_library`
**UID Management (Godot 4.4+):** `get_uid`, `update_project_uids`

## Godot Executable Path Examples

**Windows:** `C:\Program Files\Godot\Godot.exe` or `C:\Downloads\Godot_v4.5.1-stable_win64.exe\Godot_v4.5.1-stable_win64.exe`

**macOS:** `/Applications/Godot.app/Contents/MacOS/Godot`

**Linux:** `/usr/bin/godot` or `/usr/local/bin/godot`

## Troubleshooting

### "Failed to connect tool" or MCP server won't start

**Most common cause:** Wrong Godot executable path in configuration.

**Solution:**
1. Verify your Godot path by running: `"<your-godot-path>" --version`
2. Update the path in your config file:
   - **Claude Code:** Edit `.mcp.json` in your project directory
   - **Cursor:** Edit `.cursor/mcp.json` in your project directory
   - **Claude Desktop:** Check config in `%APPDATA%\Claude\` (Windows) or `~/Library/Application Support/Claude/` (macOS)

3. Restart your IDE/application after updating the config

**Check logs:**
- **Cursor:** Output panel → "MCP Logs" (Ctrl+Shift+U)
- **Claude Code:** Terminal output or MCP logs


### Manual Configuration
If you prefer manual setup, create config files:

**Claude Code** - `.mcp.json` in project directory:
```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": { "GODOT_PATH": "/path/to/godot/executable" }
    }
  }
}
```

**Cursor** - `.cursor/mcp.json` in project directory (same format as above)

**Claude Desktop** - `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": { "GODOT_PATH": "/path/to/godot/executable" }
    }
  }
}
```

## Development

```bash
npm run build      # Build the project
npm run watch      # Watch mode for development
npm run inspector  # Test with MCP inspector
```