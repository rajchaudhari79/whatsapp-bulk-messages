let csvData = [];
let headers = [];

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('csvFileInput');
  const statusDiv = document.getElementById('dataStatus');
  const phoneSelect = document.getElementById('phoneColumnSelect');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const logsDiv = document.getElementById('logs');
  const progressText = document.getElementById('progressText');

  // Load saved state
  chrome.storage.local.get(['campaignState', 'messageTemplate', 'phoneColumn', 'settings', 'currentIndex', 'csvData'], (res) => {
    if (res.messageTemplate) document.getElementById('messageTemplate').value = res.messageTemplate;
    if (res.settings) {
      document.getElementById('minDelay').value = res.settings.minDelay;
      document.getElementById('maxDelay').value = res.settings.maxDelay;
      document.getElementById('batchSize').value = res.settings.batchSize;
      document.getElementById('batchPause').value = res.settings.batchPause;
    }
    
    if (res.csvData && res.currentIndex !== undefined) {
      csvData = res.csvData;
      progressText.textContent = `${res.currentIndex} / ${res.csvData.length}`;
      statusDiv.textContent = `Loaded ${csvData.length} rows from saved session.`;
      
      if (csvData.length > 0) {
         headers = Object.keys(csvData[0]);
         phoneSelect.innerHTML = '<option value="">Select Phone Number Column...</option>';
         headers.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            phoneSelect.appendChild(opt);
         });
         if (res.phoneColumn) phoneSelect.value = res.phoneColumn;
      }
    }
    updateUIState(res.campaignState);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        csvData = results.data;
        headers = results.meta.fields;
        
        // Reset progress on new file upload
        chrome.storage.local.set({ currentIndex: 0, csvData: csvData }, () => {
           progressText.textContent = `0 / ${csvData.length}`;
        });
        
        statusDiv.textContent = `Loaded ${csvData.length} rows.`;
        
        phoneSelect.innerHTML = '<option value="">Select Phone Number Column...</option>';
        headers.forEach(h => {
          const opt = document.createElement('option');
          opt.value = h;
          opt.textContent = h;
          phoneSelect.appendChild(opt);
        });
      },
      error: function(err) {
        statusDiv.textContent = `Error parsing CSV: ${err.message}`;
      }
    });
  });

  startBtn.addEventListener('click', () => {
    const phoneCol = phoneSelect.value;
    const template = document.getElementById('messageTemplate').value;
    
    if (!csvData || !csvData.length) return alert("Please upload a CSV file first.");
    if (!phoneCol) return alert("Please select the Phone Number column.");
    if (!template) return alert("Please enter a message template.");

    const settings = {
      minDelay: parseInt(document.getElementById('minDelay').value) || 10,
      maxDelay: parseInt(document.getElementById('maxDelay').value) || 25,
      batchSize: parseInt(document.getElementById('batchSize').value) || 30,
      batchPause: parseInt(document.getElementById('batchPause').value) || 15
    };

    chrome.storage.local.set({
      csvData: csvData,
      phoneColumn: phoneCol,
      messageTemplate: template,
      settings: settings,
      campaignState: 'running'
    }, () => {
      chrome.runtime.sendMessage({ action: 'start_campaign' });
      updateUIState('running');
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop_campaign' });
    updateUIState('stopped');
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the progress back to 0?')) {
      chrome.storage.local.set({ currentIndex: 0, campaignState: 'stopped' }, () => {
        progressText.textContent = `0 / ${csvData ? csvData.length : 0}`;
        updateUIState('stopped');
        
        const logLine = document.createElement('div');
        logLine.textContent = `[${new Date().toLocaleTimeString()}] Progress reset to 0.`;
        logsDiv.appendChild(logLine);
      });
    }
  });

  function updateUIState(state) {
    if (state === 'running') {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      resetBtn.disabled = true;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      resetBtn.disabled = false;
    }
  }

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'log') {
      const logLine = document.createElement('div');
      logLine.textContent = `[${new Date().toLocaleTimeString()}] ${msg.text}`;
      logsDiv.appendChild(logLine);
      logsDiv.scrollTop = logsDiv.scrollHeight;
    } else if (msg.action === 'progress') {
      progressText.textContent = `${msg.current} / ${msg.total}`;
    } else if (msg.action === 'campaign_finished') {
      updateUIState('finished');
      const logLine = document.createElement('div');
      logLine.textContent = `[${new Date().toLocaleTimeString()}] Campaign Finished!`;
      logsDiv.appendChild(logLine);
    }
  });
});
