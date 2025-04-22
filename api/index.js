const express = require('express');
const axios = require('axios');
const { parse } = require('node-html-parser');
const path = require('path');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML Content Getter | Tofazzal Hossain</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><i class="fas fa-code"></i> HTML Content Getter</h1>
          <p>Fetch and download HTML content with resolved relative links</p>
        </div>
        
        <div class="card">
          <form method="post" id="fetchForm">
            <div class="form-group">
              <div class="input-group">
                <input type="text" class="form-control" name="url" placeholder="Enter URL (e.g. https://example.com)" required>
                <button type="submit" class="btn btn-primary" id="fetchButton">
                  <i class="fas fa-cloud-download-alt" id="buttonIcon"></i> 
                  <span id="buttonText">Get HTML</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div class="footer">
          <p>Developed with <i class="fas fa-heart" style="color: #f72585;"></i> by Tofazzal Hossain</p>
        </div>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const fetchForm = document.getElementById('fetchForm');
          const fetchButton = document.getElementById('fetchButton');
          const buttonText = document.getElementById('buttonText');
          const buttonIcon = document.getElementById('buttonIcon');
          
          fetchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Change button state while submitting
            buttonText.textContent = 'Getting HTML...';
            buttonIcon.className = 'fas fa-spinner fa-spin';
            fetchButton.disabled = true;
            
            // Submit form via fetch
            fetch('/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams(new FormData(fetchForm))
            })
            .then(response => response.text())
            .then(html => {
              document.body.innerHTML = html;
            })
            .catch(error => {
              console.error('Error:', error);
              buttonText.textContent = 'Try Again';
              buttonIcon.className = 'fas fa-redo-alt';
              fetchButton.disabled = false;
            });
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Handle form submission
app.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).send('URL is required');
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).send('Invalid URL');
    }

    // Fetch HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = response.data;

    // Fix links
    const fixedHtml = fixLinks(html, url);
    const fileName = parsedUrl.hostname;

    // Return the result page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HTML Content | ${fileName}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><i class="fas fa-code"></i> HTML Content Getter</h1>
            <p>Fetched content from ${url}</p>
          </div>
          
          <div class="card result-container">
            <h3><i class="fas fa-code"></i> HTML Content</h3>
            <textarea class="code-editor" readonly>${escapeHtml(fixedHtml)}</textarea>
            
            <form method="post" action="/download">
              <input type="hidden" name="code" value="${escapeHtml(fixedHtml)}">
              <input type="hidden" name="filename" value="${fileName}">
              <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-file-download"></i> Download HTML</button>
            </form>
            
            <a href="/" class="btn btn-primary btn-block" style="margin-top: 10px;">
              <i class="fas fa-redo-alt"></i> Get Another
            </a>
          </div>
          
          <div class="footer">
            <p>Developed with <i class="fas fa-heart" style="color: #f72585;"></i> by Tofazzal Hossain</p>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <div class="container">
        <div class="card">
          <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i> Failed to fetch URL content! Please check the URL and try again.
          </div>
          <a href="/" class="btn btn-primary btn-block">
            <i class="fas fa-redo-alt"></i> Try Again
          </a>
        </div>
        <div class="footer">
          <p>Developed with <i class="fas fa-heart" style="color: #f72585;"></i> by Tofazzal Hossain</p>
        </div>
      </div>
    `);
  }
});

// Handle download
app.post('/download', (req, res) => {
  const { code, filename } = req.body;
  
  if (!code || !filename) {
    return res.status(400).send('Missing parameters');
  }

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-\.]/g, "_") + ".html";
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
  res.send(code);
});

// Helper function to fix links
function fixLinks(html, baseUrl) {
  const root = parse(html);
  const base = new URL(baseUrl);
  const baseHref = base.origin + '/';

  // Fix href attributes
  root.querySelectorAll('[href]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      try {
        el.setAttribute('href', new URL(href, baseHref).href);
      } catch (e) {
        console.warn('Failed to fix href:', href);
      }
    }
  });

  // Fix src attributes
  root.querySelectorAll('[src]').forEach(el => {
    const src = el.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      try {
        el.setAttribute('src', new URL(src, baseHref).href);
      } catch (e) {
        console.warn('Failed to fix src:', src);
      }
    }
  });

  return root.toString();
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = app;
