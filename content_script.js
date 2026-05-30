function waitForSendButton() {
  // Querying multiple potential targets for the send button to ensure reliability
  const sendBtn = document.querySelector('button[aria-label="Send"]') || 
                  document.querySelector('[data-icon="send"]')?.closest('button') || 
                  document.querySelector('[data-icon="send"]')?.closest('div[role="button"]');
                  
  if (sendBtn) {
    if (sendBtn.disabled) return false;

    // Simulate human delay before clicking
    setTimeout(() => {
      sendBtn.click();
      
      // Fallback: Also try pressing Enter in the chat input just in case
      const mainEl = document.querySelector('#main');
      if (mainEl) {
        const inputEl = mainEl.querySelector('div[contenteditable="true"]');
        if (inputEl) {
          const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
          });
          inputEl.dispatchEvent(enterEvent);
        }
      }

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'message_sent' });
      }, 2500); // Wait 2.5 seconds after click before closing tab
    }, Math.random() * 2000 + 1500); // Wait 1.5-3.5 seconds before clicking
    return true;
  }
  
  // Alternative check: invalid number alert
  const popupText = document.body.innerText.toLowerCase();
  if (popupText.includes('phone number shared via url is invalid') || popupText.includes('invalid url')) {
    chrome.runtime.sendMessage({ action: 'log', text: 'Invalid number detected.' });
    chrome.runtime.sendMessage({ action: 'message_sent' }); // Proceed to next to avoid hanging
    return true;
  }

  // Check if "Starting chat" or similar loading screens are still there
  const loading = document.querySelector('progress');
  if (loading) {
    return false; // Still loading
  }

  return false;
}

// Start polling
let attempts = 0;
const maxAttempts = 60; // 60 seconds max wait for the page to load and find the button

const interval = setInterval(() => {
  if (waitForSendButton()) {
    clearInterval(interval);
  } else {
    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      chrome.runtime.sendMessage({ action: 'log', text: 'Timeout waiting for chat to load.' });
      chrome.runtime.sendMessage({ action: 'message_sent' }); // Proceed to next to not block the queue
    }
  }
}, 1000);
