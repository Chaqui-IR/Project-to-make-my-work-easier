const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');

function generateDocument(data, templatePath, outputPath) {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    doc.setData(data);

    try {
        doc.render();
    } catch (error) {
        console.error('Docxtemplater Error:', error);
        throw error;
    }

    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });

    fs.writeFileSync(outputPath, buf);
    console.log(`Document saved to ${outputPath}`);
}

async function convertDocxToHtml(docxPath) {
    try {
        const result = await mammoth.convertToHtml({ path: docxPath });
        return result.value; // The HTML string
    } catch (err) {
        console.error('Conversion Error:', err);
        throw err;
    }
}

module.exports = { generateDocument, convertDocxToHtml };
