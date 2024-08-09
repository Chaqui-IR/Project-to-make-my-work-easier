const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Added dialog import
const path = require('path');
const { extractTextFromImage } = require('./ocrHandler');
const { convertDocxToHtml, generateDocument } = require('./docxHandler');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Optional: preload script path if needed
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('process-image', async (event, imagePath, templatePath, outputPath) => {
    try {
        const extractedText = await extractTextFromImage(imagePath);
        console.log('Extracted text:', extractedText);

        // Extracting furnace location
        const furnaceLocationMatch = extractedText.match(/- FURNACE LOCATION:\s*(.*)/);
        const furnaceLocation = furnaceLocationMatch ? furnaceLocationMatch[1].trim() : 'Not provided';

        // Example data mapping
        const data = {
            furnaceLocation,
            // Add more fields here if needed
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
console.log(renderer.js)

app.whenReady().then(createWindow);