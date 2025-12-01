# Godot MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with the Godot game engine. Control the editor, run projects, manage scenes, and capture debug output through a standardized interface.

## Features

- **Debug Support**: Capture output, connect to remote debugger, get real-time logs
- **Seamless Integration between Godot Editor** Write code in godot editor, run, and debug with AI assistance. No longer need of running in blind or without editors.
- **Project Management**: Launch editor, run projects, list and inspect Godot projects
- **Scene Manipulation**: Create scenes, add nodes, configure properties
- **Asset Loading**: Load sprites, textures, and export mesh libraries
- **Cross-Platform**: Windows, macOS, and Linux support

## Installation

### Prerequisites

- [Godot Engine 4.x](https://godotengine.org/download) installed
- Node.js 16+ and npm

### Install from npm (coming soon)

```bash
npm install -g godot-mcp
```

### Install from source

```bash
git clone https://github.com/yourusername/godot-mcp.git
cd godot-mcp
npm install
npm run build
```

## Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": {
        "GODOT_PATH": "/path/to/your/godot/executable"
      }
    }
  }
}
```

### For Claude Code

Claude Code supports MCP servers direct configuration.

Edit `.mcp.json`:

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": {
        "GODOT_PATH": "/path/to/your/godot/executable",
        "DEBUG": "true"
      }
    }
  }
}
```

Verify the configuration:
```bash
claude mcp list
```

### For Cursor IDE

Cursor supports MCP servers through project-specific or global configuration.

**Option 1: Project-Specific (Recommended for Godot projects)**

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "godot": {
      "command": "node",
      "args": ["/path/to/godot-mcp/build/index.js"],
      "env": {
        "GODOT_PATH": "/path/to/your/godot/executable",
        "DEBUG": "true"
      }
    }
  }
}
```

**Option 2: Global Configuration**

Create `~/.cursor/mcp.json` in your home directory with the same format.

**Option 3: Via Cursor Settings UI**

1. Open Cursor Settings → Features → MCP
2. Click "+ Add New MCP Server"
3. Fill in:
   - **Name**: `godot`
   - **Command**: `node`
   - **Args**: `/path/to/godot-mcp/build/index.js`
   - **Environment**: `GODOT_PATH=/path/to/your/godot/executable`

Verify in the **Output panel** (Ctrl+Shift+U) → Select "MCP Logs"

### Environment Variables

- `GODOT_PATH`: Path to Godot executable (optional if Godot is in PATH or standard location)
- `DEBUG`: Set to `"true"` to enable detailed logging

### Platform-Specific Godot Paths

**Windows**:
```
C:\Program Files\Godot\Godot.exe
```

**macOS**:
```
/Applications/Godot.app/Contents/MacOS/Godot 
```
(do not include .app, just the executable path without ending of .app)

**Linux**:
```
/usr/bin/godot
/usr/local/bin/godot
/snap/bin/godot
```

## Available Tools

The MCP server provides the following tools that AI assistants can use:

### Project Management
- **`launch_editor`** - Launch Godot editor for a specific project
- **`run_project`** - Run a Godot project and capture output
- **`stop_project`** - Stop the currently running project
- **`list_projects`** - Find Godot projects in a directory
- **`get_project_info`** - Get metadata about a Godot project
- **`get_godot_version`** - Get the installed Godot version

### Scene Management
- **`create_scene`** - Create a new scene file with a specified root node type
- **`add_node`** - Add a node to an existing scene with optional properties
- **`load_sprite`** - Load a sprite texture into a Sprite2D node
- **`save_scene`** - Save changes to a scene file
- **`export_mesh_library`** - Export a scene as a MeshLibrary resource for GridMap

### Debug & Output
- **`get_debug_output`** - Get debug output and errors from a running project
- **`connect_remote_debugger`** - Connect to Godot editor's remote debugger (ports 6006/6007)
- **`get_remote_debug_output`** - Get output from the remote debugger connection
- **`disconnect_remote_debugger`** - Disconnect from the remote debugger
- **`capture_screenshot`** - Capture a screenshot from the running game viewport

### UID Management (Godot 4.4+)
- **`get_uid`** - Get the UID for a specific file
- **`update_project_uids`** - Resave resources to update UID references

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Testing with MCP Inspector

```bash
npm run inspector
```

This launches the MCP inspector for interactive testing of all tools.

## Note
Screenshot capture is still experimental and may not work in all environments.

## Troubleshooting

### Godot Not Found

If the server can't find Godot, set the `GODOT_PATH` environment variable in your MCP configuration:

```json
{
  "env": {
    "GODOT_PATH": "/full/path/to/godot"
  }
}
```

### Scene File Not Created

If scenes aren't being created:
1. Check directory permissions
2. Verify the project path contains `project.godot`
3. Enable debug mode to see detailed logs

### Remote Debugger Connection Issues

- Ensure Godot editor is running with remote debugging enabled
- Default ports: 6007 (editor sync), 6006 (script debugger)
- Check firewall settings aren't blocking the connection

## Related Projects

- [Model Context Protocol](https://github.com/anthropics/mcp) - The protocol specification
- [Godot Engine](https://godotengine.org/) - The game engine
- [Claude Desktop](https://claude.ai/) - AI assistant with MCP support

## Acknowledgements
Inspired by Coding Solo's godot-mcp. https://github.com/Coding-Solo/godot-mcp 

## Support

For issues and questions:
- File an issue on GitHub

## References

Configuration guides referenced from:
- [Cursor MCP Documentation](https://docs.cursor.com/context/model-context-protocol)
- [Claude Code MCP Setup Guide](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP Configuration Tutorial](https://medium.com/@tanmoy234am/how-to-set-up-mcp-servers-in-cursor-step-by-step-guide-17852970dbed)
- [Configuring MCP Tools in Claude Code](https://scottspence.com/posts/configuring-mcp-tools-in-claude-code)
