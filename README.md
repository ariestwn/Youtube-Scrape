# YouTube Video Scraper

This repository contains two scripts for scraping YouTube video data. One uses Google Apps Script with the YouTube API, and the other is a browser-based script that captures video data directly from the console.

## Getting Started

### Prerequisites
- **Google Account**: Required to use the Google Apps Script with YouTube API.
- **YouTube Data API Key**: Required to fetch data from [YouTube API](https://console.developers.google.com/).
- **Browser with Developer Tools**: Required to run the console script.

### Script 1: Google Apps Script (YouTube API)

#### Overview:
This script fetches YouTube video data using the YouTube API and stores it in a Google Spreadsheet.

#### Setup Instructions:
1. Open a Google Spreadsheet.
2. Go to `Extensions > Apps Script`.
3. Paste the code from `youtube_data_appscript.gs`.
4. Replace `API_KEY` with your YouTube Data API key.
5. Save and run the script to populate your spreadsheet with video data.

### Script 2: Browser Console Script

#### Overview:
This script scrapes YouTube video data directly from the browser console and copies it to your clipboard.

#### Setup Instructions:
1. Open YouTube in your browser.
2. Press `F12` to open Developer Tools.
3. Go to the `Console` tab.
4. Paste the code from `browser_script.js` and hit Enter.
5. The data will be copied to your clipboard.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
