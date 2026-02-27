let conversationHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  initializeTabs();
  initializeChat();
  initializePageTools();
  initializeCodeTools();
  await loadCurrentTab();
  await initPuter();
});

async function initPuter() {
  updateStatus('Loading Puter...', true);
  
  try {
    await loadScript('https://js.puter.com/v2/');
    
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
        updateStatus('Ready', false);
        return;
      }
    }
    
    updateStatus('Puter load timeout', false);
  } catch (e) {
    updateStatus('Error: ' + e.message, false);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  });
}

function updateStatus(text, loading) {
  const status = document.getElementById('status');
  status.querySelector('span:last-child').textContent = text;
  status.classList.toggle('loading', loading);
}

function initializeTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
    });
  });
}

function initializeChat() {
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    document.getElementById('page-url').textContent = tab?.url ? truncateUrl(tab.url) : 'N/A';
  } catch (err) {
    document.getElementById('page-url').textContent = 'Error';
  }
}

function truncateUrl(url) {
  return url.length > 40 ? url.substring(0, 37) + '...' : url;
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  addMessage('user', message);
  input.value = '';
  conversationHistory.push({ role: 'user', content: message });

  setLoading(true);

  try {
    const response = await callMiniMax(conversationHistory);
    addMessage('assistant', response);
    conversationHistory.push({ role: 'assistant', content: response });
  } catch (error) {
    addMessage('assistant', `Error: ${error.message}`);
  }

  setLoading(false);
}

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (content.includes('```')) {
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  }
  div.innerHTML = content;
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

async function callMiniMax(messages) {
  if (typeof puter === 'undefined' || !puter.ai) {
    throw new Error('Puter not loaded. Check internet connection.');
  }
  
  const messagesForAPI = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  try {
    const response = await puter.ai.chat(messagesForAPI, {
      model: 'openrouter:minimax/minimax-m2'
    });
    
    if (typeof response === 'string') {
      return response;
    }
    if (response?.message?.content) {
      return response.message.content;
    }
    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    return JSON.stringify(response);
  } catch (err) {
    throw new Error(err.message || 'API call failed');
  }
}

function setLoading(loading) {
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = loading;
  updateStatus(loading ? 'Thinking...' : 'Ready', loading);
}

function initializePageTools() {
  document.getElementById('get-page-btn').addEventListener('click', getPageContent);
  document.getElementById('analyze-btn').addEventListener('click', analyzePage);
}

async function getPageContent() {
  const resultArea = document.getElementById('page-result');
  setPageLoading(true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title,
        url: window.location.href,
        text: document.body.innerText.substring(0, 5000)
      })
    });
    const c = results[0].result;
    resultArea.textContent = `Title: ${c.title}\n\nURL: ${c.url}\n\nContent:\n${c.text}`;
  } catch (error) {
    resultArea.textContent = `Error: ${error.message}`;
  }
  setPageLoading(false);
}

async function analyzePage() {
  const resultArea = document.getElementById('page-result');
  setPageLoading(true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText).slice(0, 10)
      })
    });
    const pd = results[0].result;
    const response = await callMiniMax([{ 
      role: 'user', 
      content: `Analyze: ${pd.title} - ${pd.url}\nHeadings: ${pd.headings.join(', ')}` 
    }]);
    resultArea.textContent = response;
  } catch (error) {
    resultArea.textContent = `Error: ${error.message}`;
  }
  setPageLoading(false);
}

function setPageLoading(loading) {
  document.querySelectorAll('#page-panel .action-btn').forEach(b => b.disabled = loading);
  updateStatus(loading ? 'Processing...' : 'Ready', loading);
}

function initializeCodeTools() {
  document.getElementById('explain-btn').addEventListener('click', () => processCode('explain'));
  document.getElementById('fix-btn').addEventListener('click', () => processCode('fix'));
  document.getElementById('refactor-btn').addEventListener('click', () => processCode('refactor'));
}

async function processCode(action) {
  const code = document.getElementById('code-input').value.trim();
  const resultArea = document.getElementById('code-result');
  if (!code) { resultArea.textContent = 'Enter code first.'; return; }

  setCodeLoading(true);
  const prompts = {
    explain: `Explain:\n${code}`,
    fix: `Fix bugs:\n${code}`,
    refactor: `Refactor:\n${code}`
  };

  try {
    const response = await callMiniMax([{ role: 'user', content: prompts[action] }]);
    resultArea.textContent = response;
  } catch (error) {
    resultArea.textContent = `Error: ${error.message}`;
  }
  setCodeLoading(false);
}

function setCodeLoading(loading) {
  document.querySelectorAll('#code-panel .action-btn').forEach(b => b.disabled = loading);
  updateStatus(loading ? 'Processing...' : 'Ready', loading);
}
