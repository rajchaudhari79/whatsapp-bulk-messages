let isRunning = false;
let batchCount = 0;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'start_campaign') {
    chrome.storage.local.get(['currentIndex'], (res) => {
      let currentIndex = res.currentIndex || 0;
      isRunning = true;
      batchCount = 0;
      sendLog(`Campaign started from index ${currentIndex}.`);
      processNext(currentIndex);
    });
  } else if (msg.action === 'stop_campaign') {
    isRunning = false;
    sendLog("Campaign stopped by user.");
    chrome.storage.local.set({ campaignState: 'stopped' });
  } else if (msg.action === 'message_sent') {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
    }
    
    chrome.storage.local.get(['currentIndex', 'csvData', 'settings'], (res) => {
      let currentIndex = (res.currentIndex || 0) + 1;
      batchCount++;
      
      chrome.storage.local.set({ currentIndex: currentIndex }, () => {
        sendProgress(currentIndex, res.csvData ? res.csvData.length : 0);
        
        const set = res.settings;
        if (batchCount >= set.batchSize) {
          batchCount = 0;
          const pauseMs = set.batchPause * 60 * 1000;
          sendLog(`Batch limit reached. Pausing for ${set.batchPause} minutes...`);
          setTimeout(() => processNext(currentIndex), pauseMs);
        } else {
          const delayMs = Math.floor(Math.random() * (set.maxDelay - set.minDelay + 1) + set.minDelay) * 1000;
          sendLog(`Message sent. Waiting ${delayMs/1000}s for next...`);
          setTimeout(() => processNext(currentIndex), delayMs);
        }
      });
    });
  } else if (msg.action === 'log') {
    sendLog(msg.text); // Forward logs from content script
  }
});

function processNext(currentIndex) {
  if (!isRunning) return;

  chrome.storage.local.get(['csvData', 'phoneColumn', 'messageTemplate'], (res) => {
    if (!res.csvData || currentIndex >= res.csvData.length) {
      isRunning = false;
      chrome.storage.local.set({ campaignState: 'finished', currentIndex: 0 });
      chrome.runtime.sendMessage({ action: 'campaign_finished' });
      sendLog("Campaign completed successfully!");
      return;
    }

    const row = res.csvData[currentIndex];
    let phone = row[res.phoneColumn];
    
    if (!phone) {
      sendLog(`Row ${currentIndex+1}: No phone number found. Skipping.`);
      chrome.storage.local.set({ currentIndex: currentIndex + 1 }, () => {
        processNext(currentIndex + 1);
      });
      return;
    }

    // Clean phone number (remove + and spaces)
    phone = phone.replace(/[^0-9]/g, '');

    // Replace variables in template
    let text = res.messageTemplate;
    for (const key in row) {
      const regex = new RegExp(`{{${key}}}`, 'gi'); // Case-insensitive replace
      text = text.replace(regex, row[key] || '');
    }

    sendLog(`Processing row ${currentIndex+1} (${phone})...`);
    
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    // Active TRUE is crucial because Chrome throttles background tabs preventing WhatsApp Web from rendering fully
    chrome.tabs.create({ url: url, active: true }); 
  });
}

function sendLog(text) {
  chrome.runtime.sendMessage({ action: 'log', text: text });
  console.log(text);
}

function sendProgress(current, total) {
  chrome.runtime.sendMessage({ action: 'progress', current, total });
}
