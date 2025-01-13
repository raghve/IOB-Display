const { Service, EventLogger } = require('node-windows');

// Create a new service object
const svc = new Service({
  name: 'ETP_PunchDisplayService',
  description: 'ETP_PunchDisplayService backend application.',
  script: 'D:\\Ujjawal\\visitor_Display_iob\\backend\\server.js', // Path to your Node.js application
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
    svc.start(); // Start the service after installation
  });

  // Listen for the "alreadyinstalled" event
  svc.on('alreadyinstalled', () => {
    log.warn('ETP_PunchDisplayService is already installed.');
    console.log('ETP_PunchDisplayService is already installed.');
  });

  // Install the service
  svc.install();
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
}
