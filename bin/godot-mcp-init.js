#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║     Godot MCP Server - Configuration Tool     ║', 'cyan');
  log('╚════════════════════════════════════════════════╝\n', 'cyan');
}

/**
 * Detect if we're running from within the godot-mcp installation
 */
function detectGodotMcpPath() {
  // Check if running from within godot-mcp directory
  const possibleRoot = resolve(__dirname, '..');
  const buildPath = join(possibleRoot, 'build', 'index.js');

  if (existsSync(buildPath)) {
    return possibleRoot;
  }

  return null;
}

/**
 * Prompt for godot-mcp installation path
 */
async function promptGodotMcpPath(rl) {
  log('\n📦 Godot MCP Installation Path\n', 'blue');
  log('Enter the path to your godot-mcp installation:', 'cyan');
  log('  Example: /home/user/tools/godot-mcp', 'yellow');
  log('  Example: C:\\tools\\godot-mcp', 'yellow');

  const mcpPath = await rl.question('\nGodot MCP Path: ');

  if (!mcpPath.trim()) {
    log('Error: Path cannot be empty', 'red');
    return promptGodotMcpPath(rl);
  }

  // Normalize path: convert double backslashes to single backslashes
  // JSON.stringify will properly escape them when writing to file
  const normalizedPath = mcpPath.trim().replace(/\\\\/g, '\\');
  const buildPath = join(normalizedPath, 'build', 'index.js');

  if (!existsSync(buildPath)) {
    log(`Error: Could not find build/index.js at ${normalizedPath}`, 'red');
    log('Make sure you have built the project with "npm run build"', 'yellow');
    const retry = await rl.question('Try again? (Y/n): ');
    if (retry.toLowerCase() !== 'n') {
      return promptGodotMcpPath(rl);
    }
    process.exit(1);
  }

  return normalizedPath;
}

/**
 * Verify that a path is a valid Godot executable
 */
async function verifyGodotExecutable(godotPath) {
  try {
    // Try to run godot --version to verify it's a valid Godot executable
    log(`  Running: "${godotPath}" --version`, 'cyan');
    const { stdout, stderr } = await execAsync(`"${godotPath}" --version`, {
      timeout: 10000, // 10 second timeout (increased from 5)
    });

    // If the command succeeds (exit code 0), it's a valid executable
    const version = stdout.trim() || stderr.trim();
    log(`  Version: ${version}`, 'green');

    return { valid: true, version: version };
  } catch (error) {
    log(`  Command failed: ${error.message}`, 'red');
    if (error.code) {
      log(`  Error code: ${error.code}`, 'red');
    }
    if (error.killed) {
      log(`  Process was killed (timeout or signal)`, 'red');
    }
    return {
      valid: false,
      error: `Failed to execute: ${error.message}`
    };
  }
}

/**
 * Detect Godot executable path
 */
async function detectGodotPath() {
  const possiblePaths = {
    win32: [
      'C:\\Program Files\\Godot\\Godot.exe',
      'C:\\Program Files (x86)\\Godot\\Godot.exe',
      'C:\\Godot\\Godot.exe',
    ],
    darwin: [
      '/Applications/Godot.app/Contents/MacOS/Godot',
      '/Applications/Godot_mono.app/Contents/MacOS/Godot',
    ],
    linux: [
      '/usr/bin/godot',
      '/usr/local/bin/godot',
      '/snap/bin/godot',
    ],
  };

  const paths = possiblePaths[platform()] || [];

  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Prompt for Godot executable path
 */
async function promptGodotPath(rl) {
  const detected = await detectGodotPath();

  log('\n📍 Godot Executable Path\n', 'blue');

  if (detected) {
    log(`Auto-detected Godot at: ${detected}`, 'green');
    const useDetected = await rl.question(`Use this path? (Y/n): `);

    if (useDetected.toLowerCase() !== 'n') {
      return detected;
    }
  } else {
    log('Could not auto-detect Godot installation', 'yellow');
  }

  log('\nPlease enter the full path to your Godot executable:', 'cyan');

  if (platform() === 'win32') {
    log('  Example: C:\\Program Files\\Godot\\Godot.exe', 'yellow');
  } else if (platform() === 'darwin') {
    log('  Example: /Applications/Godot.app/Contents/MacOS/Godot', 'yellow');
  } else {
    log('  Example: /usr/bin/godot', 'yellow');
  }

  const godotPath = await rl.question('\nGodot Path: ');

  if (!godotPath.trim()) {
    log('Error: Path cannot be empty', 'red');
    return promptGodotPath(rl);
  }

  // Normalize path: convert double backslashes to single backslashes
  // JSON.stringify will properly escape them when writing to file
  const normalizedPath = godotPath.trim().replace(/\\\\/g, '\\');

  if (!existsSync(normalizedPath)) {
    log(`Error: File does not exist at ${normalizedPath}`, 'red');
    const retry = await rl.question('Try again? (Y/n): ');
    if (retry.toLowerCase() !== 'n') {
      return promptGodotPath(rl);
    }
    log('Warning: Proceeding with invalid path', 'yellow');
    return normalizedPath;
  }

  // Verify it's a valid Godot executable
  log('Verifying Godot executable...', 'cyan');
  const verification = await verifyGodotExecutable(normalizedPath);

  if (verification.valid) {
    log(`✓ Valid Godot executable detected: ${verification.version}`, 'green');
    return normalizedPath;
  } else {
    log(`Error: ${verification.error}`, 'red');
    log('This does not appear to be a valid Godot executable', 'yellow');
    const proceed = await rl.question('Use this path anyway? (y/N): ');
    if (proceed.toLowerCase() === 'y') {
      log('Warning: Proceeding with unverified path', 'yellow');
      return normalizedPath;
    }
    return promptGodotPath(rl);
  }
}

/**
 * Select which MCP clients to configure
 */
async function selectClients(rl) {
  log('\n📦 Select MCP Clients to Configure\n', 'blue');
  log('1) Claude Desktop (global configuration)', 'cyan');
  log('2) Claude Code (project-specific .mcp.json)', 'cyan');
  log('3) Cursor (project-specific .cursor/mcp.json)', 'cyan');
  log('4) All of the above', 'cyan');

  const choice = await rl.question('\nEnter your choice (1-4): ');

  const clients = {
    claude_desktop: choice === '1' || choice === '4',
    claude_code: choice === '2' || choice === '4',
    cursor: choice === '3' || choice === '4',
  };

  if (!clients.claude_desktop && !clients.claude_code && !clients.cursor) {
    log('Invalid choice. Please select 1-4', 'red');
    return selectClients(rl);
  }

  return clients;
}

/**
 * Get Claude Desktop config path
 */
function getClaudeDesktopConfigPath() {
  const homeDir = homedir();

  switch (platform()) {
    case 'darwin':
      return join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32':
      return join(process.env.APPDATA || join(homeDir, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
    default:
      return join(homeDir, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Write Claude Desktop configuration
 */
async function writeClaudeDesktopConfig(buildPath, godotPath) {
  const configPath = getClaudeDesktopConfigPath();
  const configDir = dirname(configPath);

  try {
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    let config = {};

    if (existsSync(configPath)) {
      try {
        const existing = readFileSync(configPath, 'utf8');
        config = JSON.parse(existing);
      } catch (e) {
        log(`Warning: Could not parse existing config at ${configPath}`, 'yellow');
      }
    }

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers.godot = {
      command: 'node',
      args: [buildPath],
      env: {
        GODOT_PATH: godotPath,
      },
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`  ✓ Claude Desktop config written to: ${configPath}`, 'green');
  } catch (error) {
    log(`  ✗ Failed to write Claude Desktop config: ${error.message}`, 'red');
  }
}

/**
 * Write Claude Code configuration
 */
async function writeClaudeCodeConfig(buildPath, godotPath) {
  const configPath = join(process.cwd(), '.mcp.json');

  try {
    let config = {};

    if (existsSync(configPath)) {
      try {
        const existing = readFileSync(configPath, 'utf8');
        config = JSON.parse(existing);
      } catch (e) {
        log(`Warning: Could not parse existing config at ${configPath}`, 'yellow');
      }
    }

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers.godot = {
      command: 'node',
      args: [buildPath],
      env: {
        GODOT_PATH: godotPath,
        DEBUG: 'true',
      },
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`  ✓ Claude Code config written to: ${configPath}`, 'green');
  } catch (error) {
    log(`  ✗ Failed to write Claude Code config: ${error.message}`, 'red');
  }
}

/**
 * Write Cursor configuration
 */
async function writeCursorConfig(buildPath, godotPath) {
  const cursorDir = join(process.cwd(), '.cursor');
  const configPath = join(cursorDir, 'mcp.json');

  try {
    if (!existsSync(cursorDir)) {
      mkdirSync(cursorDir, { recursive: true });
    }

    let config = {};

    if (existsSync(configPath)) {
      try {
        const existing = readFileSync(configPath, 'utf8');
        config = JSON.parse(existing);
      } catch (e) {
        log(`Warning: Could not parse existing config at ${configPath}`, 'yellow');
      }
    }

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers.godot = {
      command: 'node',
      args: [buildPath],
      env: {
        GODOT_PATH: godotPath,
        DEBUG: 'true',
      },
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`  ✓ Cursor config written to: ${configPath}`, 'green');
  } catch (error) {
    log(`  ✗ Failed to write Cursor config: ${error.message}`, 'red');
  }
}

/**
 * Main function
 */
async function main() {
  banner();

  // Detect if running from godot-mcp directory or elsewhere
  const detectedMcpPath = detectGodotMcpPath();
  const currentDir = process.cwd();

  if (detectedMcpPath) {
    log(`Detected godot-mcp installation at: ${detectedMcpPath}`, 'green');
    if (resolve(detectedMcpPath) === resolve(currentDir)) {
      log('Running from godot-mcp directory', 'cyan');
      log('This will configure clients for your Godot projects', 'yellow');
    }
  }

  const rl = readline.createInterface({ input, output });

  try {
    // Get godot-mcp path
    let mcpPath;
    if (detectedMcpPath) {
      const useCurrent = await rl.question(`\nUse detected path? (Y/n): `);
      if (useCurrent.toLowerCase() === 'n') {
        mcpPath = await promptGodotMcpPath(rl);
      } else {
        mcpPath = detectedMcpPath;
      }
    } else {
      log('\nCould not auto-detect godot-mcp installation', 'yellow');
      mcpPath = await promptGodotMcpPath(rl);
    }

    const buildPath = join(mcpPath, 'build', 'index.js');
    log(`\n✓ Using build: ${buildPath}`, 'green');

    // Get Godot path
    const godotPath = await promptGodotPath(rl);

    // Select clients
    const clients = await selectClients(rl);

    log('\n⚙️  Writing Configuration Files...\n', 'blue');

    if (clients.claude_desktop) {
      await writeClaudeDesktopConfig(buildPath, godotPath);
    }

    if (clients.claude_code) {
      await writeClaudeCodeConfig(buildPath, godotPath);
    }

    if (clients.cursor) {
      await writeCursorConfig(buildPath, godotPath);
    }

    log('\n✅ Configuration complete!\n', 'green');

    log('Next steps:', 'cyan');
    if (clients.claude_desktop) {
      log('  • Restart Claude Desktop to load the new configuration', 'yellow');
    }
    if (clients.claude_code) {
      log('  • Run "claude mcp list" to verify the server is registered', 'yellow');
    }
    if (clients.cursor) {
      log('  • Restart Cursor and check MCP Logs in Output panel (Ctrl+Shift+U)', 'yellow');
    }

    log('\nConfiguration locations:', 'cyan');
    if (clients.claude_code) {
      log(`  • Claude Code: ${join(currentDir, '.mcp.json')}`, 'magenta');
    }
    if (clients.cursor) {
      log(`  • Cursor: ${join(currentDir, '.cursor', 'mcp.json')}`, 'magenta');
    }
    if (clients.claude_desktop) {
      log(`  • Claude Desktop: ${getClaudeDesktopConfigPath()}`, 'magenta');
    }

    log('');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
