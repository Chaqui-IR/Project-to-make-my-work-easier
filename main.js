const { app, BrowserWindow, ipcMain, dialog } = require('electron/main'); // Correct import
const path = require('path'); // Use 'path' from 'node:path'
const { extractTextFromImage } = require('./ocrHandler');
const { convertDocxToHtml, generateDocument } = require('./docxHandler');

function createWindow() {
  const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true, // Required for security
          enableRemoteModule: false, // Disable remote module
      }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
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
      // Validate input types
      if (typeof imagePath !== 'string' || typeof templatePath !== 'string' || typeof outputPath !== 'string') {
          throw new Error('Invalid input type');
      }

      // Validate that paths are absolute and prevent directory traversal
      const path = require('path');
      const isValidPath = (p) => path.isAbsolute(p) && !p.includes('..');
      if (!isValidPath(imagePath) || !isValidPath(templatePath) || !isValidPath(outputPath)) {
          throw new Error('Invalid file path');
      }

      // Extract text from image
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

      // Map extracted information
      const data = {
          furnaceLocation: furnaceLocationMatch ? furnaceLocationMatch[1].trim() : 'Unknown',
          assignedParking: assignedParkingMatch ? assignedParkingMatch[1].trim() : 'Unknown',
          filterSize: filterSizeMatch ? filterSizeMatch[1].trim() : 'Unknown',
          mailboxNumberLocation: mailboxNumberLocationMatch ? mailboxNumberLocationMatch[1].trim() : 'Unknown',
          doorCodes: doorCodesMatch ? doorCodesMatch[1].trim() : 'Unknown',
          trashDay: trashDayMatch ? trashDayMatch[1].trim() : 'Unknown',
          otherNotes: otherNotesMatch ? otherNotesMatch[1].trim() : 'Unknown',
      };

      // Generate document
      await generateDocument(data, templatePath, outputPath);

      return { success: true };
  } catch (error) {
      console.error('Processing error:', error);
      return { success: false, error: error.message };
  }
});

ipcMain.handle('convert-docx-to-html', async (event, docxPath) => {
  try {
      // Validate input type
      if (typeof docxPath !== 'string') {
          throw new Error('Invalid input type');
      }

      // Validate that path is absolute and prevent directory traversal
      const path = require('path');
      if (!path.isAbsolute(docxPath) || docxPath.includes('..')) {
          throw new Error('Invalid file path');
      }

      const htmlContent = await convertDocxToHtml(docxPath);
      return { success: true, htmlContent };
  } catch (error) {
      return { success: false, error: error.message };
  }
});

ipcMain.handle('save-dialog', async () => {
  try {
      const { filePath } = await dialog.showSaveDialog({
          title: 'Save Processed Document',
          defaultPath: 'output.docx',
          filters: [
              { name: 'Word Documents', extensions: ['docx'] },
          ],
      });

      // Return the filePath if it's a valid string
      if (typeof filePath === 'string') {
          return { filePath };
      } else {
          throw new Error('Invalid file path');
      }
  } catch (error) {
      console.error('Save dialog error:', error);
      return { filePath: null, error: error.message };
  }
});