// Ensure the app version info is displayed
document.addEventListener('DOMContentLoaded', () => {
    const information = document.getElementById('info');
    information.innerText = `This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`;

    // Setup the contextBridge
    const { ipcRenderer } = require('electron');
    window.electron = {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
    };

    // Add event listener to word document input
    document.getElementById('word-doc').addEventListener('change', async (event) => {
        console.log('Word document selected:', event.target.files[0]);
        const wordDoc = event.target.files[0];

        if (wordDoc) {
            try {
                const htmlContent = await window.electron.invoke('convert-docx-to-html', wordDoc.path);
                console.log('Fetched HTML Content:', htmlContent); // Debugging line

                // Verify HTML content is valid
                if (htmlContent) {
                    console.log('Setting HTML content to preview...');
                    document.getElementById('preview').innerHTML = htmlContent;
                    console.log('HTML Content set to preview:', htmlContent);
                } else {
                    console.error('No content returned from the conversion.');
                    document.getElementById('status').textContent = 'No content returned from the conversion.';
                }
            } catch (error) {
                console.error('Error converting document:', error);
                document.getElementById('status').textContent = 'Error converting document: ' + error.message;
            }
        } else {
            console.warn('No document selected.');
        }
    });

    // Add event listener to process button
    document.getElementById('process-btn').addEventListener('click', async () => {
        const wordDoc = document.getElementById('word-doc').files[0];
        const imageFile = document.getElementById('image-file').files[0];
        console.log('Process Document button clicked');
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
                document.getElementById('status')







