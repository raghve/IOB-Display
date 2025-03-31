const path = require('path');

const backendConfig = {
  // Define port, frontend URL, and folder path
  port: 3000, // The backend server port
  host: '',
  frontendUrl: 'http://localhost:4200', // The URL of the frontend app
  folderPath: 'D:/Ujjawal/visitor_Display_iob/src/assets/watched-folder', // Folder to watch
  timestampIndex: 8,
  scriptPath: 'D:\\Ujjawal\\visitor_Display_iob\\backend\\server.js',
  profileImgpath: 'D:\\Ujjawal\\visitor_Display_iob\\src\\assets\\Visitor',
  sqlConfig : {
    user: 'sa',       // SQL Server username
    password: 'Etp@1986$#',   // SQL Server password
    server: '192.168.1.152',  // Server address or IP
    database: 'EasyTimePay_Jupitar',
    options: {
      encrypt: true, // Use encryption
      trustServerCertificate: true, // For self-signed certificates
    },
  }
};

module.exports = backendConfig;




