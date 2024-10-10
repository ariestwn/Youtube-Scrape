// Select all video elements
const videos = document.querySelectorAll('ytd-rich-grid-media');

// Loop through each video element to extract the details
const videoDetails = Array.from(videos).map(video => {
    const titleElement = video.querySelector('#video-title');
    const viewsElement = video.querySelector('#metadata-line .inline-metadata-item');
    const dateElement = viewsElement?.nextElementSibling;
    
    // Find the length of the video, if available
    const lengthElement = video.querySelector('span.ytd-thumbnail-overlay-time-status-renderer');
    const lengthText = lengthElement?.textContent.trim() || 'N/A';  // Getting length text

    return {
        title: titleElement?.textContent.trim() || 'N/A',
        views: viewsElement?.textContent.trim() || 'N/A',
        publishedDate: dateElement?.textContent.trim() || 'N/A',
        length: lengthText,  // Include video length
    };
});

// Function to convert JSON data to TSV format
const convertToTSV = (data) => {
    const header = 'Title\tViews\tPublished Date\tLength'; // Updated the header to include Length
    const rows = data.map(item => {
        // Use tab characters to separate values
        return `${item.title}\t${item.views}\t${item.publishedDate}\t${item.length}`;
    });
    // Join header and rows with new line character
    return [header, ...rows].join('\n');
};

// Convert video details to TSV
const tsvData = convertToTSV(videoDetails);

// Copy TSV data to clipboard
const copyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        console.log('TSV data copied to clipboard!');
    } catch (err) {
        console.error('Could not copy TSV data: ', err);
    }
    
    document.body.removeChild(textarea);
};

// Optional: Log the result
console.log(videoDetails);

// Copy the TSV data to clipboard
copyToClipboard(tsvData);
