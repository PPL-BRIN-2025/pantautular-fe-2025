const { spawn } = require('child_process');

/**
 * Wrap `next start` so that platform-initiated shutdowns (e.g. idle sleep)
 * exit cleanly instead of bubbling up as npm ELIFECYCLE errors.
 */
const child = spawn('next', ['start'], {
  stdio: 'inherit',
  env: process.env,
});

const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

terminationSignals.forEach((signal) => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
});

child.on('exit', (code, signal) => {
  if (signal) {
    // Treat expected shutdown signals as a successful exit so npm does not report ELIFECYCLE.
    process.exit(0);
  }

  if (code === 0 || code === 130 || code === 143) {
    process.exit(0);
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
