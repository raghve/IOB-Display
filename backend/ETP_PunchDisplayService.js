const { Service, EventLogger } = require('node-windows');

const backendConfig = require('./backendConfig'); // Importing the backend configuration

const scriptPath = backendConfig.scriptPath;

// Create a new service object
const svc = new Service({
  name: 'ETP_PunchDisplayService',
  description: 'ETP_PunchDisplayService backend application.',
  script: scriptPath, // Path to your Node.js application
});

// Create an event logger
const log = new EventLogger('ETP_Punch Display Service');

// Get the command from command-line arguments
const command = process.argv[2];

// Handle commands
if (command === 'install') {
  // Listen for the "install" event
  svc.on('install', () => {
    log.info('ETP_PunchDisplayService installed successfully.');
    console.log('ETP_PunchDisplayService installed successfully!');

    // Ensure the service starts after installation
    svc.start();
    console.log('ETP_PunchDisplayService started after installation.');
  });

  // Listen for the "alreadyinstalled" event
  svc.on('alreadyinstalled', () => {
    log.warn('ETP_PunchDisplayService is already installed.');
    console.log('ETP_PunchDisplayService is already installed.');
  });

  // Install the service
  svc.install();
} else if (command === 'restart') {
  // Stop the service first
  svc.on('stop', () => {
    log.info('ETP_PunchDisplayService stopped for restart.');
    console.log('ETP_PunchDisplayService stopped for restart.');

    // Start the service again
    svc.start();
    log.info('ETP_PunchDisplayService restarted successfully.');
    console.log('ETP_PunchDisplayService restarted successfully!');
  });

  // Stop the service
  svc.stop();
} else if (command === 'uninstall') {
  // Listen for the "uninstall" event
  svc.on('uninstall', () => {
    log.info('ETP_PunchDisplayService uninstalled successfully.');
    console.log('ETP_PunchDisplayService uninstalled successfully!');
  });

  // Uninstall the service
  svc.uninstall();
} else if (command === 'log') {
  // Log custom messages to the Windows Event Viewer
  log.info('Custom log: ETP_PunchDisplayService is running smoothly.');
  log.warn('Custom log: This is a warning message.');
  log.error('Custom log: This is an error message.');
  console.log('Custom log messages have been sent to the Windows Event Viewer.');
} else {
  console.log('Invalid command! Use one of the following:');
  console.log('  node ETP_PunchDisplayService.js install');
  console.log('  node ETP_PunchDisplayService.js uninstall');
  console.log('  node ETP_PunchDisplayService.js log');
}
