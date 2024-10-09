// YouTube API key
const API_KEY = 'REPLACE WITH YOUR API';

// Main function for scraping by channel ID
function scrapeYouTube(channelId, minViews) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  let nextPageToken = '';
  const maxResults = 50;
  let videoIds = [];
  
  // Add header row
  const headers = ['Title', 'Published Date', 'Views', 'Likes', 'Comments', 'Engagement Rate (%)', 'Video URL'];
  sheet.appendRow(headers);

  do {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&pageToken=${nextPageToken}`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      Logger.log(data);
      throw new Error('Failed to fetch data: ' + data.error.message);
    }

    data.items.forEach(video => {
      if (video.id?.kind === 'youtube#video') {
        videoIds.push(video.id.videoId);
      }
    });

    nextPageToken = data.nextPageToken || '';

  } while (nextPageToken);

  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const videoIdsBatch = videoIds.slice(i, i + batchSize);
    fetchAndWriteVideoDetails(videoIdsBatch, sheet, minViews);
  }
}

// Main function for scraping by keyword
function scrapeYouTubeByKeyword(searchKeyword, minViews, maxVideos) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  let nextPageToken = '';
  const maxResults = 50;
  let videoIds = [];
  
  // Add header row
  const headers = ['Title', 'Channel', 'Published Date', 'Views', 'Likes', 'Comments', 'Engagement Rate (%)', 'Video URL'];
  sheet.appendRow(headers);

  try {
    do {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${encodeURIComponent(searchKeyword)}&part=snippet,id&type=video&maxResults=${maxResults}&pageToken=${nextPageToken}`;
      const response = UrlFetchApp.fetch(searchUrl, { muteHttpExceptions: true });
      const data = JSON.parse(response.getContentText());

      if (response.getResponseCode() !== 200) {
        Logger.log(data);
        throw new Error('Failed to fetch data: ' + data.error.message);
      }

      data.items.forEach(video => {
        if (video.id?.kind === 'youtube#video') {
          videoIds.push(video.id.videoId);
        }
      });

      nextPageToken = data.nextPageToken || '';

    } while (nextPageToken && videoIds.length < maxVideos);

    // Trim videoIds to maxVideos if we've collected more
    if (videoIds.length > maxVideos) {
      videoIds = videoIds.slice(0, maxVideos);
    }

    // Process videos in batches
    const batchSize = 50;
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const videoIdsBatch = videoIds.slice(i, i + batchSize);
      fetchAndWriteSearchVideoDetails(videoIdsBatch, sheet, minViews);
    }
  } catch (e) {
    Logger.log(`Error in scrapeYouTubeByKeyword: ${e.message}`);
    throw e;
  }
}

// Function to fetch and write video details for channel search
function fetchAndWriteVideoDetails(videoIdsBatch, sheet, minViews) {
  const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIdsBatch.join(',')}&part=snippet,statistics,contentDetails`;
  const videoDetailsResponse = UrlFetchApp.fetch(videoDetailsUrl, { muteHttpExceptions: true });
  const videoDetailsData = JSON.parse(videoDetailsResponse.getContentText());

  if (videoDetailsResponse.getResponseCode() !== 200) {
    Logger.log(videoDetailsData);
    throw new Error('Failed to fetch video details: ' + videoDetailsData.error.message);
  }

  videoDetailsData.items.forEach(video => {
    const title = video.snippet?.title || 'No Title';
    const publishedDate = video.snippet?.publishedAt || 'No Date';
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const views = parseInt(video.statistics?.viewCount || 0);
    const likes = parseInt(video.statistics?.likeCount || 0);
    const comments = parseInt(video.statistics?.commentCount || 0);
    const duration = video.contentDetails?.duration;

    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    if (!isShorts(duration) && views >= minViews) {
      sheet.appendRow([
        title,
        publishedDate,
        views,
        likes,
        comments,
        engagementRate.toFixed(2),
        videoUrl
      ]);
    }
  });
}

// Function to fetch and write video details for keyword search
function fetchAndWriteSearchVideoDetails(videoIdsBatch, sheet, minViews) {
  try {
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIdsBatch.join(',')}&part=snippet,statistics,contentDetails`;
    const videoDetailsResponse = UrlFetchApp.fetch(videoDetailsUrl, { muteHttpExceptions: true });
    const videoDetailsData = JSON.parse(videoDetailsResponse.getContentText());

    if (videoDetailsResponse.getResponseCode() !== 200) {
      Logger.log(videoDetailsData);
      throw new Error('Failed to fetch video details: ' + videoDetailsData.error.message);
    }

    videoDetailsData.items.forEach(video => {
      try {
        const title = video.snippet?.title || 'No Title';
        const channelTitle = video.snippet?.channelTitle || 'No Channel';
        const publishedDate = video.snippet?.publishedAt || 'No Date';
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const views = parseInt(video.statistics?.viewCount || 0);
        const likes = parseInt(video.statistics?.likeCount || 0);
        const comments = parseInt(video.statistics?.commentCount || 0);
        const duration = video.contentDetails?.duration;

        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

        if (!isShorts(duration) && views >= minViews) {
          sheet.appendRow([
            title,
            channelTitle,
            publishedDate,
            views,
            likes,
            comments,
            engagementRate.toFixed(2),
            videoUrl
          ]);
        }
      } catch (videoError) {
        Logger.log(`Error processing video ${video.id}: ${videoError.message}`);
      }
    });
  } catch (e) {
    Logger.log(`Error in fetchAndWriteSearchVideoDetails: ${e.message}`);
    throw e;
  }
}

// Helper functions
function isShorts(duration) {
  try {
    const durationSeconds = parseYouTubeDuration(duration);
    return durationSeconds < 60;
  } catch (e) {
    Logger.log(`Error checking if video is shorts: ${e.message}`);
    return false;
  }
}

function parseYouTubeDuration(duration) {
  if (!duration) {
    Logger.log('Null or empty duration provided');
    return 0;
  }

  try {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) {
      Logger.log(`Unmatched duration format: ${duration}`);
      return 0;
    }

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  } catch (e) {
    Logger.log(`Error parsing duration: ${e.message}`);
    return 0;
  }
}

// UI Functions
function promptAndScrape() {
  const ui = SpreadsheetApp.getUi();
  const channelIdResponse = ui.prompt(
    'YouTube Channel Search',
    'Enter the YouTube Channel ID:',
    ui.ButtonSet.OK_CANCEL);
  
  if (channelIdResponse.getSelectedButton() !== ui.Button.OK) return;
  const channelId = channelIdResponse.getResponseText().trim();
  
  const minViewsResponse = ui.prompt(
    'YouTube Channel Search',
    'Enter the minimum view count:',
    ui.ButtonSet.OK_CANCEL);
  
  if (minViewsResponse.getSelectedButton() !== ui.Button.OK) return;
  const minViews = parseInt(minViewsResponse.getResponseText().trim(), 10);
  
  if (isNaN(minViews) || minViews < 0) {
    ui.alert('Error', 'Please enter a valid number for the minimum view count.', ui.ButtonSet.OK);
    return;
  }
  
  try {
    scrapeYouTube(channelId, minViews);
    ui.alert('Success', 'Channel scraping completed successfully!', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'An error occurred while scraping: ' + e.message, ui.ButtonSet.OK);
  }
}

function promptAndScrapeByKeyword() {
  const ui = SpreadsheetApp.getUi();
  
  const keywordResponse = ui.prompt(
    'YouTube Keyword Search',
    'Enter the search keyword:',
    ui.ButtonSet.OK_CANCEL);
  
  if (keywordResponse.getSelectedButton() !== ui.Button.OK) return;
  const keyword = keywordResponse.getResponseText().trim();
  
  const minViewsResponse = ui.prompt(
    'YouTube Keyword Search',
    'Enter the minimum view count:',
    ui.ButtonSet.OK_CANCEL);
  
  if (minViewsResponse.getSelectedButton() !== ui.Button.OK) return;
  const minViews = parseInt(minViewsResponse.getResponseText().trim(), 10);
  
  if (isNaN(minViews) || minViews < 0) {
    ui.alert('Error', 'Please enter a valid number for the minimum view count.', ui.ButtonSet.OK);
    return;
  }
  
  const maxVideosResponse = ui.prompt(
    'YouTube Keyword Search',
    'Enter the maximum number of videos to list (max 500):',
    ui.ButtonSet.OK_CANCEL);
  
  if (maxVideosResponse.getSelectedButton() !== ui.Button.OK) return;
  let maxVideos = parseInt(maxVideosResponse.getResponseText().trim(), 10);
  
  if (isNaN(maxVideos) || maxVideos <= 0) {
    ui.alert('Error', 'Please enter a valid number for the maximum videos.', ui.ButtonSet.OK);
    return;
  }
  
  maxVideos = Math.min(maxVideos, 500);
  
  const loadingDialog = ui.alert(
    'Processing',
    `Searching for up to ${maxVideos} videos with minimum ${minViews} views for keyword "${keyword}".\n\nThis may take a while...`,
    ui.ButtonSet.OK);
  
  try {
    scrapeYouTubeByKeyword(keyword, minViews, maxVideos);
    ui.alert('Success', 'Keyword search completed successfully!', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'An error occurred while searching: ' + e.message, ui.ButtonSet.OK);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('YouTube Scraper')
    .addItem('Search by Channel ID', 'promptAndScrape')
    .addItem('Search by Keyword', 'promptAndScrapeByKeyword')
    .addToUi();
}
