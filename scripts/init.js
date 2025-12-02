#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║     Godot MCP Server - Configuration Init     ║', 'cyan');
  log('╚════════════════════════════════════════════════╝\n', 'cyan');
}

async function checkBuild() {
  const buildPath = join(projectRoot, 'build', 'index.js');

  if (!existsSync(buildPath)) {
    log('✗ Build files not found!', 'red');
    log('\nPlease run the following command first:', 'yellow');
    log('  npm run build\n', 'bright');
    process.exit(1);
  }

  log('✓ Build files found', 'green');
  return buildPath;
}

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

async function promptGodotPath(rl) {
  const detected = await detectGodotPath();

  log('\n📍 Godot Path Configuration\n', 'blue');

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

  if (!existsSync(godotPath.trim())) {
    log(`Warning: File does not exist at ${godotPath}`, 'yellow');
    const proceed = await rl.question('Continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      return promptGodotPath(rl);
    }
  }

  return godotPath.trim();
}

async function selectClients(rl) {
  log('\n📦 Select MCP Clients to Configure\n', 'blue');
  log('1) Claude Desktop', 'cyan');
  log('2) Claude Code (.mcp.json in project)', 'cyan');
  log('3) Cursor (.cursor/mcp.json in project)', 'cyan');
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

function createMcpConfig(buildPath, godotPath) {
  return {
    mcpServers: {
      godot: {
        command: 'node',
        args: [buildPath],
        env: {
          GODOT_PATH: godotPath,
        },
      },
    },
  };
}

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

async function main() {
  banner();

  const buildPath = await checkBuild();

  const rl = readline.createInterface({ input, output });

  try {
    const godotPath = await promptGodotPath(rl);
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
      log('  • Restart Cursor and check MCP Logs in Output panel', 'yellow');
    }

    log('\nFor testing, run:', 'cyan');
    log('  npm run inspector\n', 'bright');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
