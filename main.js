const { app, BrowserWindow, ipcMain, dialog } = require('electron/main'); // Correct import
const path = require('path'); // Use 'path' from 'node:path'
const { extractTextFromImage } = require('./ocrHandler');
const { convertDocxToHtml, generateDocument } = require('./docxHandler');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Missing comma fixed
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('process-image', async (event, imagePath, templatePath, outputPath) => {
    try {
        const extractedText = await extractTextFromImage(imagePath);
        console.log('Extracted text:', extractedText);

        // Extracting information from extracted text
        const furnaceLocationMatch = extractedText.match(/- FURNACE LOCATION:\s*(.*)/);
        const assignedParkingMatch = extractedText.match(/- ASSIGNED PARKING INFO:\s*(.*)/);
        const filterSizeMatch = extractedText.match(/- FURNACE FILTER SIZE:\s*(.*)/);
        const mailboxNumberLocationMatch = extractedText.match(/- MAILBOX NUMBER AND LOCATION:\s*(.*)/);
        const doorCodesMatch = extractedText.match(/- DOOR CODES:\s*(.*)/);
        const trashDayMatch = extractedText.match(/- TRASH AND RECYCLE DAYS:\s*(.*)/);
        const otherNotesMatch = extractedText.match(/- OTHER NOTES FROM OWNER:\s*(.*)/);

        const furnaceLocation = furnaceLocationMatch ? furnaceLocationMatch[1].trim() : 'Unknown';
        const assignedParking = assignedParkingMatch ? assignedParkingMatch[1].trim() : 'Unknown';
        const filterSize = filterSizeMatch ? filterSizeMatch[1].trim() : 'Unknown';
        const mailboxNumberLocation = mailboxNumberLocationMatch ? mailboxNumberLocationMatch[1].trim() : 'Unknown';
        const doorCodes = doorCodesMatch ? doorCodesMatch[1].trim() : 'Unknown';
        const trashDay = trashDayMatch ? trashDayMatch[1].trim() : 'Unknown';
        const otherNotes = otherNotesMatch ? otherNotesMatch[1].trim() : 'Unknown';

        // Example data mapping
        const data = {
            furnaceLocation,
            assignedParking,
            filterSize,
            mailboxNumberLocation,
            doorCodes,
            trashDay,
            otherNotes,
        };

        generateDocument(data, templatePath, outputPath);

        return { success: true };
    } catch (error) {
        console.error('Processing error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('convert-docx-to-html', async (event, docxPath) => {
    try {
        const htmlContent = await convertDocxToHtml(docxPath);
        return htmlContent;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-dialog', async () => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Save Processed Document',
        defaultPath: 'output.docx',
        filters: [
            { name: 'Word Documents', extensions: ['docx'] },
        ],
    });

    return { filePath };
});

