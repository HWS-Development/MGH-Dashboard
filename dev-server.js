/**
 * Development server launcher.
 * Starts both Laravel (port 8000) and Vite (port 5173) simultaneously.
 * Works reliably on Windows without TTY issues.
 */
import { spawn } from 'child_process';

const isWindows = process.platform === 'win32';

function startProcess(name, command, args, color) {
  const prefix = `[${name}]`;
  const colorCode = color === 'magenta' ? '\x1b[35m' : '\x1b[36m';
  const reset = '\x1b[0m';

  const proc = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: isWindows,
    windowsHide: false,
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        process.stdout.write(`${colorCode}${prefix}${reset} ${line}\n`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        process.stderr.write(`${colorCode}${prefix}${reset} ${line}\n`);
      }
    });
  });

  proc.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${colorCode}${prefix}${reset} exited with code ${code}`);
    }
  });

  return proc;
}

console.log('\x1b[32m[dev]\x1b[0m Starting Laravel + Vite development servers...\n');

const laravel = startProcess(
  'Laravel',
  'php',
  ['artisan', 'serve', '--port=8000'],
  'magenta'
);

// Give Laravel a moment to start before launching Vite
setTimeout(() => {
  const vite = startProcess(
    'Vite',
    'npx',
    ['vite'],
    'cyan'
  );

  // If either process dies, kill the other
  laravel.on('close', (code) => {
    if (code !== 0) {
      console.error('\n\x1b[31m[dev]\x1b[0m Laravel crashed. Stopping Vite...');
      vite.kill();
      process.exit(1);
    }
  });

  vite.on('close', (code) => {
    if (code !== 0) {
      console.error('\n\x1b[31m[dev]\x1b[0m Vite stopped. Stopping Laravel...');
      laravel.kill();
      process.exit(1);
    }
  });
}, 1000);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\x1b[33m[dev]\x1b[0m Shutting down...');
  laravel.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  laravel.kill();
  process.exit(0);
});
