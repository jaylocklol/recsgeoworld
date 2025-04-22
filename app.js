const firebaseConfig = {
  apiKey: "AIzaSyAnNUZc3JA51Sqq7WHth5oTBCdL5W1zTvE",
  authDomain: "chat-5cc70.firebaseapp.com",
  databaseURL: "https://chat-5cc70-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chat-5cc70",
  storageBucket: "chat-5cc70.firebasestorage.app",
  messagingSenderId: "506254461742",
  appId: "1:506254461742:web:970599731a09f9fea188bf",
  measurementId: "G-5F3YXJX3LN"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let countries = {};
let userCountryCode = '';
let userCountryName = '';
let userClicks = 0;
let userId = '';
let username = '';
let darkMode = false;
let lastMessageTime = 0;
const messageCooldown = 2000;

const usernameModal = document.getElementById('username-modal');
const modalUsername = document.getElementById('modal-username');
const modalSubmit = document.getElementById('modal-submit');
const usernameError = document.getElementById('username-error');
const charCount = document.getElementById('char-count');
const pogusjxbapalczumqpei = document.getElementById('country-select');
const detectingCountrySection = document.getElementById('detecting-country');
const gameArea = document.getElementById('game-area');
const countryDropdown = document.getElementById('country-dropdown');
const selectBtn = document.getElementById('select-btn');
const clickButton = document.getElementById('click-button');
const currentCountryName = document.getElementById('current-country-name');
const currentCountryFlag = document.getElementById('current-country-flag');
const countryNameDisplay = document.getElementById('country-name-display');
const userClicksDisplay = document.getElementById('user-clicks');
const leaderboardTable = document.getElementById('leaderboard-table');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardLoading = document.getElementById('leaderboard-loading');
const sidebar = document.getElementById('sidebar');
const chatInterface = document.getElementById('chat-interface');
const chatMessages = document.getElementById('chat-messages');
const chatMessage = document.getElementById('chat-message');
const chatSend = document.getElementById('chat-send');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const chatToggle = document.getElementById('chat-toggle');
const chatClose = document.getElementById('chat-close');

async function init() {
    userId = localStorage.getItem('userId') || generateUUID();
    localStorage.setItem('userId', userId);
    
    darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    username = localStorage.getItem('username') || '';
    
    if (!username) {
        showUsernameModal();
    } else {
        startApplication();
    }
}

function showUsernameModal() {
    usernameModal.style.display = 'block';
    
    modalSubmit.addEventListener('click', () => {
        const inputUsername = modalUsername.value.trim();
        if (inputUsername.length < 3) {
            usernameError.textContent = 'Username must be at least 3 characters';
            return;
        }
        if (inputUsername.length > 12) {
            usernameError.textContent = 'Username must be 12 characters or less';
            return;
        }
        
        username = inputUsername;
        localStorage.setItem('username', username);
        usernameModal.style.display = 'none';
        startApplication();
    });
    
    modalUsername.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modalSubmit.click();
        }
    });
}

function startApplication() {
    chatMessage.addEventListener('input', () => {
        const remaining = 100 - chatMessage.value.length;
        charCount.textContent = chatMessage.value.length;
        charCount.style.color = remaining < 20 ? 'red' : 'inherit';
    });

    loadCountries().then(() => {
        detectCountry();
    });
    
    setupEventListeners();
}

function setupEventListeners() {
    selectBtn.addEventListener('click', selectCountry);
    clickButton.addEventListener('click', registerClick);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    chatSend.addEventListener('click', sendMessage);
    chatMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', closeChat);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function loadCountries() {
    try {
        const response = await fetch('https://flagcdn.com/en/codes.json');
        countries = await response.json();
        
        countryDropdown.innerHTML = '<option value="">-- Select Country --</option>';
        for (const [code, name] of Object.entries(countries)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            countryDropdown.appendChild(option);
        }
    } catch (error) {
        console.error('Failed to load countries:', error);
    }
}

async function detectCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.org && data.org.includes("AVAST Software s.r.o.")) {
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e74c3c;">VPN Detected</h1>
                    <p style="font-size: 1.2em;">
                        Hello! VPNs are allowed on this website, but we have decided to block 
                        HMA VPN/AVAST VPN/Any Other VPN That Uses AVAST Software s.r.o., 
                        for the reason that it is too easy to get every country on the website.
                    </p>
                    <p style="font-size: 1.2em;">
                        We hope you understand!
                    </p>
                    <p style="margin-top: 30px;">
                        <small>If you believe this is a mistake, please disable your VPN and refresh the page.</small>
                    </p>
                </div>
            `;
            return;
        }
        
        if (data.country_code && countries[data.country_code.toLowerCase()]) {
            userCountryCode = data.country_code.toLowerCase();
            userCountryName = countries[userCountryCode];
            
            setupCountryClicksListener();
            setupLeaderboardListener();
            
            detectingCountrySection.classList.add('hidden');
            updateCurrentCountryDisplay();
            gameArea.classList.remove('hidden');
            showChatAuth();
        } else {
            detectingCountrySection.textContent = 'Could not detect your country. DM Rec.';
            detectingCountrySection.classList.remove('loading');
        }
    } catch (error) {
        console.error('Failed to detect country:', error);
        detectingCountrySection.textContent = 'Could not detect your country. DM Rec.';
        detectingCountrySection.classList.remove('loading');
    }
}

function setupCountryClicksListener() {
    if (!userCountryCode) return;
    
    database.ref(`countries/${userCountryCode}/clicks`).on('value', (snapshot) => {
        const countryClicks = snapshot.val() || 0;
        userClicksDisplay.textContent = countryClicks.toLocaleString();
        
        const clickElement = document.getElementById('user-clicks');
        clickElement.classList.add('click-update');
        setTimeout(() => {
            clickElement.classList.remove('click-update');
        }, 300);
    });
}

async function selectCountry() {
    const selectedCode = countryDropdown.value;
    if (!selectedCode) return;
    
    userCountryCode = selectedCode;
    userCountryName = countries[userCountryCode];
    
    setupCountryClicksListener();
    setupLeaderboardListener();
    
    countrySelectSection.classList.add('hidden');
    updateCurrentCountryDisplay();
    gameArea.classList.remove('hidden');
    showChatAuth();
}

function showChatAuth() {
    sidebar.classList.remove('hidden');
    chatInterface.classList.remove('hidden');
    
    database.ref('chat')
        .orderByChild('timestamp')
        .limitToLast(100)
        .on('value', (snapshot) => {
            chatMessages.innerHTML = '';
            const messages = snapshot.val();
            if (messages) {
                Object.values(messages).forEach(message => {
                    addMessageToChat(message);
                });
            }
        });
}

function sendMessage() {
    const now = Date.now();
    if (now - lastMessageTime < messageCooldown) {
        alert(`Please wait ${Math.ceil((messageCooldown - (now - lastMessageTime))/1000)} more seconds before sending another message`);
        return;
    }
    
    const messageText = chatMessage.value.trim();
    if (!messageText || !username) return;
    if (messageText.length > 100) {
        alert('Message must be 100 characters or less');
        return;
    }
    
    const message = {
        userId,
        username,
        countryCode: userCountryCode,
        countryName: userCountryName,
        text: messageText,
        timestamp: Date.now()
    };
    
    const newMessageRef = database.ref('chat').push();
    newMessageRef.set(message)
        .then(() => {
            chatMessage.value = '';
            charCount.textContent = '0';
            lastMessageTime = now;
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    
    chatSend.disabled = true;
    setTimeout(() => {
        chatSend.disabled = false;
    }, messageCooldown);
}

function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    messageElement.innerHTML = `
        <div class="message-header">
            <img src="https://flagcdn.com/w20/${message.countryCode}.png" width="20" alt="${message.countryName}" class="message-flag">
            ${message.username}
        </div>
        <div class="message-text">${message.text}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    const isNearBottom = chatMessages.scrollHeight - chatMessages.clientHeight - chatMessages.scrollTop < 100;
    if (isNearBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    const messages = chatMessages.querySelectorAll('.message');
    if (messages.length > 100) {
        chatMessages.removeChild(messages[0]);
    }
}

function toggleChat() {
    sidebar.classList.toggle('open');
    localStorage.setItem('chatOpen', sidebar.classList.contains('open'));
}

function closeChat() {
    sidebar.classList.remove('open');
    localStorage.setItem('chatOpen', false);
}

function updateCurrentCountryDisplay() {
    currentCountryName.textContent = userCountryName;
    countryNameDisplay.textContent = userCountryName;
    currentCountryFlag.innerHTML = `<img src="https://flagcdn.com/w80/${userCountryCode}.png" width="80" alt="${userCountryName}">`;
    userClicksDisplay.textContent = "Loading...";
}

function setupLeaderboardListener() {
    database.ref('countries').orderByChild('clicks').on('value', (snapshot) => {
        const countriesData = snapshot.val();
        updateLeaderboard(countriesData);
    });
}

function updateLeaderboard(countriesData) {
    if (!countriesData) {
        leaderboardBody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
        return;
    }
    
    const leaderboard = [];
    for (const [code, data] of Object.entries(countriesData)) {
        if (countries[code]) {
            leaderboard.push({
                code,
                name: data.name || countries[code],
                clicks: data.clicks || 0
            });
        }
    }
    
    leaderboard.sort((a, b) => b.clicks - a.clicks);
    
    leaderboardBody.innerHTML = '';
    leaderboard.forEach((country, index) => {
        const row = document.createElement('tr');
        
        if (country.code === userCountryCode) {
            row.classList.add('user-row');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="flag-cell"><img src="https://flagcdn.com/w40/${country.code}.png" width="40" alt="${country.name}"></td>
            <td>${country.name}</td>
            <td>${country.clicks.toLocaleString()}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
    
    leaderboardLoading.classList.add('hidden');
    leaderboardTable.classList.remove('hidden');
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
}

async function registerClick() {
    try {
        const countryRef = database.ref(`countries/${userCountryCode}`);
        const snapshot = await countryRef.once('value');
        const currentClicks = snapshot.val()?.clicks || 0;
        
        await countryRef.set({
            name: userCountryName,
            code: userCountryCode,
            clicks: currentClicks + 1,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        });
        
        clickButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickButton.style.transform = 'scale(1)';
        }, 100);
    } catch (error) {
        console.error('Error updating clicks:', error);
    }
}

init();
