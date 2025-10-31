// server/routes/preview-excel.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const XLSX = require('xlsx');
const csvParser = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');

// 🔒 Convert Excel/CSV file from URL to HTML table
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing file URL');

    console.log('🌀 Previewing Excel file from:', url);

    // Download file (array buffer)
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || '';

    let htmlOutput = '';

    // 🧮 Handle CSV
    if (url.endsWith('.csv') || contentType.includes('csv')) {
      const csvText = response.data.toString('utf-8');
      const records = csvParser.parse(csvText, { skip_empty_lines: true });

      htmlOutput = `
        <table style="border-collapse: collapse; width: 100%;">
          ${records
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell) =>
                      `<td style="border: 1px solid #ccc; padding: 8px;">${cell}</td>`
                  )
                  .join('')}</tr>`
            )
            .join('')}
        </table>
      `;
    } else {
      // 🧾 Handle Excel (XLS/XLSX)
      const workbook = XLSX.read(response.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      htmlOutput = XLSX.utils.sheet_to_html(sheet);
    }

    // ✅ Wrap HTML in a protected container
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Excel Preview</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 20px;
              background: #fafafa;
              color: #222;
              overflow-x: auto;
              overflow-y: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              background: white;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            tr:nth-child(even) { background: #f9f9f9; }
            tr:hover { background: #f1f1f1; }
            td, th {
              user-select: none;
            }
          </style>
          <script>
            // Prevent right-click or key combos (Ctrl+S/P)
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('keydown', e => {
              if ((e.ctrlKey && (e.key === 's' || e.key === 'p'))) {
                e.preventDefault();
                alert('🚫 Saving/Printing disabled.');
              }
            });
          </script>
        </head>
        <body>
          <h2>📊 Secure Excel Preview</h2>
          ${htmlOutput}
        </body>
      </html>
    `);
  } catch (err) {
    console.error('❌ Excel preview error:', err.message);
    res.status(500).send('Failed to preview Excel/CSV file.');
  }
});

module.exports = router;
