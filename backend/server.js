const express = require('express');
const chokidar = require('chokidar');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const socketIo = require('socket.io');
const sql = require('mssql')

const app = express();
const server = http.createServer(app);

const backendConfig = require('./backendConfig'); // Importing the backend configuration



const folderPath = backendConfig.folderPath; // Folder to watch
const profileImgpath = backendConfig.profileImgpath;
const sqlConfig = backendConfig.sqlConfig; // SQL configuration

// Enable CORS for all domains (or specify a specific domain)
app.use(cors({
  origin: backendConfig.frontendUrl, // Allow only the Angular app to access the backend
  methods: ['GET', 'POST'],
  credentials: true 
}));

// Enable CORS
const io = socketIo(server, {
  cors: {
    origin: backendConfig.frontendUrl, 
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
    // Paths for profile image 
    const profileImagePath = path.join(profileImgpath, `${latestFileData.profileImageName}.jpg`);

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

       // Read the profile image
    fs.readFile(profileImagePath, (err, profileImageData) => {
      let base64ProfileImage = null;
      if (err) {
        console.error('Error reading profile image1:', err);
        base64ProfileImage = base64Image;
      } else {
        base64ProfileImage = `data:image/jpeg;base64,${profileImageData.toString('base64')}`;
      }

      const payload = {
        deviceId,
        base64Image,
        base64ProfileImage,
        name: latestFileData.name || null,
        companyName: latestFileData.companyName || null,
        department: latestFileData.department || null,
        expectedOutTime: latestFileData.expectedOutTime || null,
        type: latestFileData.type || null,
        profileImageName: latestFileData.profileImageName || null
      };

      console.log('Emitted Payload:', payload);
      io.emit('file-added', payload);
    });
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
     let [name = null, companyName = null, department = null, expectedOutTime = null, type = null, profileImageName = null] = latestFile.replace('.jpg', '').split('~');

     
     name = formatName(name) || null;
     companyName = formatName(companyName) || null;
     department = department || null;
     expectedOutTime = formatTimestamp(expectedOutTime) || null;
     type = type || null;
     profileImageName = profileImageName || null;


    // Paths for profile image 
    const profileImagePath = path.join(profileImgpath, `${profileImageName}.jpg`);

  // Read the image file and convert it to base64
     fs.readFile(filePath, (err, data) => {
      if (err) {
      console.error('Error reading image file:', err);
      return res.status(500).send('Error reading image file.');
    }

    //  const base64Image = data.toString('base64');
     const base64Image = `data:image/jpeg;base64,${data.toString('base64')}`;


       // Read the profile image
       fs.readFile(profileImagePath, (err, profileImageData) => {
         console.log("Profile Image path :", profileImagePath)
         let base64ProfileImage = '';
         if (err) {
           console.error('Error reading profile image2:', err);
           base64ProfileImage = base64Image;
         }else {
          base64ProfileImage = `data:image/jpeg;base64,${profileImageData.toString('base64')}`;
        }

    // Send the image in base64 format along with the details
     res.json({
      base64Image,
      base64ProfileImage, // profile Image
      name ,
      companyName,
      department,
      expectedOutTime,
      type,
      profileImageName
     });
    });
  });

    } catch (error) {
      console.error('Error processing files1:', error.message);
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
  const [name, companyName, department, expectedOutTime, type, profileImageName] = fileName.split('~'); // Split by `~`

  return {
    name: formatName(name) || null,
    companyName: formatName(companyName) || null,
    department : formatName(department) || null,
    expectedOutTime: formatTimestamp(expectedOutTime) || null, // Format expectedOutTime
    type: type || null ,
    profileImageName: profileImageName || null
  };
}

// Endpoint to get Material QR Details from SQL DB
app.get('/getmaterialList/:qrCodeId', async (req, res) => { 
  const qrCodeId = req.params.qrCodeId;
  const materialQuery = `select VM.MaterialType,VM.Quantity,VM.SerialNumber,VM.ItemScope,VM.Detail,ISNULL(RS.StatusName,'Pending') MaterialApprovesStatus 
  from VMS.VisitorMaterial vm
  INNER JOIN VMS.VisitorLog VL ON VM.VisitorLogID=VL.VisitorLogID
  LEFT JOIN APP.RequestStatus RS ON VL.MaterialRequestStatusID=RS.RequestStatusID
  WHERE VL.QRCodeID='${qrCodeId}' AND VL.MaterialRequestStatusID=1 AND vm.active=1`; // MSSQL

  const detailsQuery = `select VM.FullName,ISNULL(VL.GatePassRefNo,'N/A') GatePassRefNo,VM.CompanyName,ISNULL(VL.IsVendor,0)IsVendor,
		E.EmployeeName,E.Department,E.Designation from VMS.Visitor vm
    INNER JOIN VMS.VisitorLog VL ON VM.VisitorID=VL.VisitorID
    INNER JOIN EMP.VW_Employee E ON VL.MaterialApprovedBy=E.EmployeeID
    WHERE VL.QRCodeID='${qrCodeId}' AND VL.MaterialRequestStatusID=1`


  try {
    const pool = await sql.connect(backendConfig.sqlConfig);

    const materialResult = await pool.request().input('qrCodeId', sql.NVarChar, qrCodeId).query(materialQuery);
    console.log("Material List :",materialResult.recordset);
    // res.status(200).json(materialResult.recordset);

    if (materialResult.recordset.length === 0) {
      return res.status(404).json({ message: 'No material list found for the provided QR Code ID.' });
    }

    const detailsResult = await pool.request().input('qrCodeId', sql.NVarChar, qrCodeId).query(detailsQuery);
    console.log("Details :",detailsResult.recordset);

    //Return both Response in Single Response
    return res.status(200).json({
      materialList: materialResult.recordset,
      details: detailsResult.recordset
    });
  } catch (err) {
    console.log("Error in Get Material List :", err.message);
  }

});

const PORT = backendConfig.port;
const HOST = backendConfig.host;
  server.listen(PORT,() => {
      console.log(`Server running on http://${HOST}:${PORT}`);
  });