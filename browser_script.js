// Select all video elements
const videos = document.querySelectorAll('ytd-rich-grid-media');

// Loop through each video element to extract the details
const videoDetails = Array.from(videos).map(video => {
    const titleElement = video.querySelector('#video-title');
    const viewsElement = video.querySelector('#metadata-line .inline-metadata-item');
    const dateElement = viewsElement?.nextElementSibling;
    const urlElement = video.querySelector('a#thumbnail');

    return {
        title: titleElement?.textContent.trim(),
        views: viewsElement?.textContent.trim(),
        publishedDate: dateElement?.textContent.trim(),
        url: urlElement?.href
    };
});

// Convert the array to CSV format
let csvContent = "Title,Views,Published Date,URL\n";
videoDetails.forEach(video => {
    csvContent += `"${video.title}","${video.views}","${video.publishedDate}","${video.url}"\n`;
});

// Create a Blob from the CSV content
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

// Create a link element for download
const link = document.createElement("a");
const url = URL.createObjectURL(blob);
link.setAttribute("href", url);
link.setAttribute("download", "video_details.csv");
link.style.visibility = 'hidden';
document.body.appendChild(link);

// Programmatically click the link to trigger the download
link.click();

// Remove the link from the document
document.body.removeChild(link);
