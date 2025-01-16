const express = require('express');
const chokidar = require('chokidar');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const backendConfig = require('./backendConfig'); // Importing the backend configuration



const folderPath = backendConfig.folderPath; // Folder to watch

// Enable CORS for all domains (or specify a specific domain)
app.use(cors({
  origin: backendConfig.frontendUrl, // Allow only the Angular app to access the backend
  methods: ['GET', 'POST'],
  credentials: true // Enable cookies if needed
}));

// Enable CORS
const io = socketIo(server, {
  cors: {
    origin: backendConfig.frontendUrl, // Angular app URL
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

  // Endpoint to get device IDs
  app.get('/get-device-ids', (req, res) => {
    fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return res.status(500).send('Error reading directory.');
      }
  
      // Filter for directories only
      const deviceIds = files
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      console.log("DeviceID -", deviceIds)
      res.json(deviceIds);
    });
  });


// Watch the folder for changes
const watcher = chokidar.watch(folderPath, { persistent: true });

//      ---------New Code File Watcher------
watcher.on('add', (filePath) => {
  console.log(`File added: ${filePath}`);

  try {
    const latestFileData = parseFilePath(filePath);
    console.log('Parsed File Data:', latestFileData);

    // Extract deviceId from filePath (modify logic based on folder structure)
    const pathParts = filePath.split(path.sep);
    const deviceId = pathParts[pathParts.length - 3]; // Adjust as needed

    console.log('Device ID:', deviceId);

    // Read the file and convert to Base64
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }

      const base64Image = `data:image/jpeg;base64,${data.toString('base64')}`;

      const payload = {
        deviceId,
        base64Image,
        name: latestFileData.name || null,
        companyName: latestFileData.companyName || null,
        department: latestFileData.department || null,
        expectedOutTime: latestFileData.expectedOutTime || null,
        type: latestFileData.type || null,
      };

      console.log('Emitted Payload:', payload);
      io.emit('file-added', payload);
    });
  } catch (error) {
    console.error('Error processing file:', error.message);
  }
});


// API to get the latest image for a selected Device ID and current date
app.get('/get-latest-image/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format as yyyyMMdd
  const deviceFolderPath = path.join(folderPath, deviceId, currentDate);

  // Check if the folder for the device and date exists
  if (!fs.existsSync(deviceFolderPath)) {
    return res.status(404).send('Device folder not found.');
  }

  fs.readdir(deviceFolderPath, async (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return res.status(500).send('Error reading folder.');
    }

    if (files.length === 0) {
      return res.status(404).send('No files found.');
    }

    let latestMtime = 0;
    let latestImage = null;
    let latestFile = null;
    try {
      // Get the latest file in the folder
      for (const file of files) {
        const filePath = path.join(deviceFolderPath, file);
  
        // Await fs.stat inside a promise to make it synchronous
        const stats = await new Promise((resolve, reject) => {
          fs.stat(filePath, (err, stats) => {
            if (err) {
              console.log(`Error reading file stats for ${file}:`, err);
              return reject(err);
            }
            resolve(stats);
          });
        });
  
        // If it's a file and the modification time is more recent, update the latest file
        if (stats.isFile() && stats.mtimeMs > latestMtime) {
          latestMtime = stats.mtimeMs;
          latestImage = file;
          console.log("LatestImage :", latestImage, "Latest Mtime :", latestMtime);
        }
      }
  
      // After iterating over all files, set the latest file
      latestFile = latestImage;
      
      console.log("Latest data :", latestFile);
      const filePath = path.join(deviceFolderPath, latestFile);
      console.log('Filepath', filePath);
      //Name~CompanyName~Department~ExpectedOuttime~type
     let [name = null, companyName = null, department = null, expectedOutTime = null, type = null] = latestFile.replace('.jpg', '').split('~');

     
     name = formatName(name) || null;
     companyName = formatName(companyName) || null;
     department = department || null;
     expectedOutTime = formatTimestamp(expectedOutTime) || null;
     type = type || null;

  // Read the image file and convert it to base64
     fs.readFile(filePath, (err, data) => {
      if (err) {
      console.error('Error reading image file:', err);
      return res.status(500).send('Error reading image file.');
    }

     const base64Image = data.toString('base64');

    // Send the image in base64 format along with the details
     res.json({
      base64Image: `data:image/jpeg;base64,${base64Image}`, // Sending the base64 encoded image
      name ,
      companyName,
      department,
      expectedOutTime,
      type
     });
  });

    } catch (error) {
      console.error('Error processing files:', error.message);
      return res.status(500).send('Error processing files.');
    }
  });
});


// Function to format name (add space between first and last name)
function formatName(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Function to format timestamp (yyyymmddhhmmss to dd MMM yyyy hh:mm:ss)
function formatTimestamp(timestamp) {
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hours = timestamp.substring(8, 10);
  const minutes = timestamp.substring(10, 12);
  const seconds = timestamp.substring(12, 14);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const formattedDate = `${day} ${months[parseInt(month, 10) - 1]} ${year} ${hours}:${minutes}:${seconds}`;
  return formattedDate  || null;
}


function parseFilePath(filePath) {
  const fileName = path.basename(filePath, '.jpg'); // Extract the file name without the extension
  const [name, companyName, department, expectedOutTime, type] = fileName.split('~'); // Split by `~`

  return {
    name: formatName(name) || null,
    companyName: formatName(companyName) || null,
    department : formatName(department) || null,
    expectedOutTime: formatTimestamp(expectedOutTime) || null, // Format expectedOutTime
    type: type || null ,
  };
}

const PORT = backendConfig.port;
const HOST = backendConfig.host;
  server.listen(PORT,() => {
      console.log(`Server running on http://${HOST}:${PORT}`);
  });