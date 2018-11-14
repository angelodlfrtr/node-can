const os = require('os');
const spawn = require('cross-spawn');

if (os.platform() === 'linux') {
  spawn.sync('npm', ['run-script', 'linux-install'], {
    input: 'Linux detected. Build native socketcan module.',
    stdio: 'inherit',
  });
}
