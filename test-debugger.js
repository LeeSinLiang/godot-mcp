#!/usr/bin/env node
/**
 * Test script to connect to Godot's remote debugger and see raw output
 * Usage: node test-debugger.js [port]
 * Default port: 6006 (script debugger)
 */

import { Socket } from 'net';

const port = process.argv[2] ? parseInt(process.argv[2]) : 6006;
const host = 'localhost';

console.log(`\n=== Godot Remote Debugger Test ===`);
console.log(`Attempting to connect to ${host}:${port}`);
console.log(`Make sure Godot editor is running and you've pressed F5 to run your game.\n`);

const socket = new Socket();

socket.connect(port, host, () => {
  console.log(`✓ Connected to ${host}:${port}\n`);
  console.log(`Waiting for data... (Run your game with F5 in Godot)\n`);
  console.log(`=== RAW DATA ===\n`);
});

let buffer = Buffer.alloc(0);
let packetCount = 0;

socket.on('data', (data) => {
  packetCount++;

  console.log(`\n--- Packet #${packetCount} (${data.length} bytes) ---`);

  // Show hex dump
  console.log('HEX:');
  const hex = data.toString('hex');
  for (let i = 0; i < hex.length; i += 32) {
    console.log(`  ${hex.substring(i, i + 32)}`);
  }

  // Show as UTF-8 text (with control chars as dots)
  console.log('\nTEXT (raw):');
  const text = data.toString('utf8').replace(/[\x00-\x1F\x7F-\x9F]/g, '.');
  console.log(`  ${text}`);

  // Try to extract strings
  console.log('\nEXTRACTED STRINGS:');
  buffer = Buffer.concat([buffer, data]);

  // Try to find any printable strings
  const fullText = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  const strings = fullText.match(/[a-zA-Z0-9_:.,!? ]{3,}/g);
  if (strings) {
    strings.forEach((str, i) => {
      if (str.length > 2) {
        console.log(`  [${i}] "${str}"`);
      }
    });
  } else {
    console.log('  (no readable strings found)');
  }

  // Try length-prefixed string parsing
  console.log('\nLENGTH-PREFIXED STRINGS:');
  let found = false;
  for (let offset = 0; offset < Math.min(buffer.length - 4, 200); offset++) {
    const len = buffer.readUInt32LE(offset);
    if (len > 0 && len < 1000 && offset + 4 + len <= buffer.length) {
      const str = buffer.toString('utf8', offset + 4, offset + 4 + len);
      if (str && /[a-zA-Z]/.test(str)) {
        console.log(`  At offset ${offset}: [len=${len}] "${str}"`);
        found = true;
      }
    }
  }
  if (!found) {
    console.log('  (no valid length-prefixed strings found)');
  }

  // Clear old buffer data
  if (buffer.length > 8192) {
    buffer = buffer.subarray(-4096);
  }

  console.log('');
});

socket.on('error', (err) => {
  console.error(`\n✗ Connection error: ${err.message}`);
  console.error('\nTroubleshooting:');
  console.error('  1. Make sure Godot editor is running');
  console.error('  2. Press F5 in Godot to start your game');
  console.error('  3. Try port 6007 instead: node test-debugger.js 6007');
  console.error('  4. Check Editor > Editor Settings > Network > Debug');
  process.exit(1);
});

socket.on('close', () => {
  console.log('\n✗ Connection closed');
  process.exit(0);
});

socket.on('end', () => {
  console.log('\n✓ Connection ended gracefully');
  process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nDisconnecting...');
  socket.destroy();
  process.exit(0);
});

console.log('Press Ctrl+C to exit\n');
