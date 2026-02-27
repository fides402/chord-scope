console.log('MiniMax AI Assistant loaded');

let selectionTooltip = null;
let puterReady = false;

function loadPuter() {
  return new Promise((resolve, reject) => {
    if (typeof puter !== 'undefined' && puter?.ai) {
      puterReady = true;
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => {
      let attempts = 0;
      const check = setInterval(() => {
        if (typeof puter !== 'undefined' && puter?.ai?.chat) {
          puterReady = true;
          clearInterval(check);
          resolve();
        }
        attempts++;
        if (attempts > 20) {
          clearInterval(check);
          reject(new Error('Puter not available'));
        }
      }, 300);
    };
    script.onerror = () => reject(new Error('Failed to load Puter.js'));
    document.head.appendChild(script);
  });
}

loadPuter().catch(console.error);

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0) {
    showTooltip(e.pageX, e.pageY, selection);
  } else {
    hideTooltip();
  }
});

document.addEventListener('mousedown', hideTooltip);

function showTooltip(x, y, text) {
  if (!selectionTooltip) {
    selectionTooltip = document.createElement('div');
    selectionTooltip.id = 'minimax-tooltip';
    selectionTooltip.innerHTML = `
      <button id="minimax-analyze">Analyze</button>
      <button id="minimax-explain">Explain</button>
      <button id="minimax-translate">Translate</button>
    `;
    document.body.appendChild(selectionTooltip);
  }

  selectionTooltip.style.left = `${x}px`;
  selectionTooltip.style.top = `${y + 10}px`;
  selectionTooltip.style.display = 'flex';
  selectionTooltip.dataset.text = text;

  selectionTooltip.querySelector('#minimax-analyze').onclick = () => analyzeSelection(text);
  selectionTooltip.querySelector('#minimax-explain').onclick = () => explainSelection(text);
  selectionTooltip.querySelector('#minimax-translate').onclick = () => translateSelection(text);
}

function hideTooltip() {
  if (selectionTooltip) {
    selectionTooltip.style.display = 'none';
  }
}

async function callAPI(prompt) {
  if (!puterReady) {
    throw new Error('Puter not loaded. Wait a moment and try again.');
  }
  
  const response = await puter.ai.chat(prompt, {
    model: 'openrouter:minimax/minimax-m2'
  });
  
  if (typeof response === 'string') {
    return response;
  }
  if (response?.message?.content) {
    return response.message.content;
  }
  return JSON.stringify(response);
}

async function analyzeSelection(text) {
  hideTooltip();
  showResult('Analyzing...');
  try {
    const response = await callAPI(`Analyze: "${text}"`);
    showResult(response);
  } catch (e) {
    showResult('Error: ' + e.message);
  }
}

async function explainSelection(text) {
  hideTooltip();
  showResult('Explaining...');
  try {
    const response = await callAPI(`Explain: "${text}"`);
    showResult(response);
  } catch (e) {
    showResult('Error: ' + e.message);
  }
}

async function translateSelection(text) {
  hideTooltip();
  showResult('Translating...');
  try {
    const response = await callAPI(`Translate to English: "${text}"`);
    showResult(response);
  } catch (e) {
    showResult('Error: ' + e.message);
  }
}

function showResult(content) {
  const existing = document.getElementById('minimax-result-popup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'minimax-result-popup';
  popup.innerHTML = `
    <div class="minimax-result-header">
      <span>MiniMax Result</span>
      <button id="minimax-close">&times;</button>
    </div>
    <div class="minimax-result-content">${content}</div>
  `;
  document.body.appendChild(popup);
  popup.querySelector('#minimax-close').onclick = () => popup.remove();
  setTimeout(() => popup.remove(), 30000);
}

const style = document.createElement('style');
style.textContent = `
  #minimax-tooltip {
    position: absolute;
    display: none;
    gap: 4px;
    padding: 6px;
    background: #1a1a2e;
    border: 1px solid #0f3460;
    border-radius: 6px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  #minimax-tooltip button {
    padding: 6px 10px;
    background: #0f3460;
    color: #eaeaea;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }
  #minimax-tooltip button:hover { background: #e94560; }
  
  #minimax-result-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    max-height: 400px;
    background: #1a1a2e;
    border: 1px solid #0f3460;
    border-radius: 8px;
    z-index: 999999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .minimax-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #16213e;
    border-bottom: 1px solid #0f3460;
    font-weight: 600;
    font-size: 13px;
  }
  #minimax-close {
    background: none;
    border: none;
    color: #888;
    font-size: 20px;
    cursor: pointer;
  }
  #minimax-close:hover { color: #e94560; }
  .minimax-result-content {
    padding: 12px;
    max-height: 340px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.5;
    color: #eaeaea;
  }
`;
document.head.appendChild(style);
