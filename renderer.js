const { ipcRenderer } = require('electron');
const path = require('path');

// Add event listener to process button
document.getElementById('process-btn').addEventListener('click', async () => {
    const wordDoc = document.getElementById('word-doc').files[0];
    const imageFile = document.getElementById('image-file').files[0];

    console.log('Selected files:', wordDoc, imageFile);

    if (!wordDoc || !imageFile) {
        document.getElementById('status').textContent = 'Please upload both files.';
        return;
    }

    try {
        // Request save path from user
        const { filePath } = await window.electron.invoke('save-dialog');
        console.log('Save dialog result:', filePath);

        if (!filePath) {
            document.getElementById('status').textContent = 'Save operation was canceled.';
            return;
        }

        const templatePath = wordDoc.path;
        const imagePath = imageFile.path;
        const outputPath = filePath.endsWith('.docx') ? filePath : `${filePath}.docx`;

        console.log('Paths:', { templatePath, imagePath, outputPath });

        const result = await window.electron.invoke('process-image', imagePath, templatePath, outputPath);
        console.log('Process image result:', result);

        if (result.success) {
            document.getElementById('status').textContent = `Document saved to ${outputPath}`;
        } else {
            document.getElementById('status').textContent = 'Error: ' + result.error;
        }
    } catch (error) {
        document.getElementById('status').textContent = 'An unexpected error occurred: ' + error.message;
        console.error('Processing error:', error);
    }
});
