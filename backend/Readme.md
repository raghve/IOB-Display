# ETP Punch Display Service

This project allows you to set up a Node.js service for displaying punch data. Follow the steps below to configure, install, and run the service.

## Steps to Set Up

### 1. Copy the Files

Copy the following files to the required directory:

- Main Node Js File: Ex.-`server.js`
- Service File: Ex.-`ETP_PunchDisplayService.js`
- Config File: Ex.-`BackendConfig.js`
- `BatchFiles` (Optional)

### 2. Edit the BackendConfig File

Open the `BackendConfig.js` file and edit the following fields with the actual server details:

- **Host**: Enter the host address of your server.
- **Port**: Enter the port number.
- **Frontend URL**: Enter the URL for your frontend application.
- **Folder Path**: Specify the folder path required for your application.

### 3. Install Node Dependencies
Navigate to your project directory and run the following command in the Command Prompt to install the necessary dependencies:

npm install


### 4. Install the Node Windows Service
To install the Node.js service (ETP_PunchDisplayService.js), run the following command in the Command Prompt:

node ETP_PunchDisplayService.js install

### 5. Restart the Node Windows Service
To restart the Node.js service (ETP_PunchDisplayService.js), run the following command in the Command Prompt:

node ETP_PunchDisplayService.js restart


### 6. Uninstall the Node Windows Service
If you need to uninstall the service, run the following command in the Command Prompt:

node ETP_PunchDisplayService.js uninstall

### 7. Logging the Node Windows Service
Logs can be checked in the event log. Ensure the service is running correctly and look for logs in your system’s Event Viewer under the "Application" logs.

node ETP_PunchDisplayService.js log

### 8. Test the System from the UI
After setting up, test the system from the UI to ensure everything is working as expected.

### Note for VPN Users
1. If you are using a VPN with no internet access on the server, make sure to copy the @nodemodules directory to the project directory as well.
2. Instead of Running Command for Node Service, You can also use batch files to install, uninstall & log.