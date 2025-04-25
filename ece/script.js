// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxG45k-YVmeHlU1Vk8DVU4Fel0UNIb7PU",
  authDomain: "chat-website-61631.firebaseapp.com",
  databaseURL: "https://chat-website-61631-default-rtdb.firebaseio.com",
  projectId: "chat-website-61631",
  storageBucket: "chat-website-61631.firebasestorage.app",
  messagingSenderId: "56953808722",
  appId: "1:56953808722:web:777b7135baaa11e477fc8b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global variables
let userCountry = "";
let userCountryName = "";
let username = "";
let chatInitialized = false;

// DOM elements
const loadingElement = document.getElementById('loading');
const flagContainer = document.getElementById('flag-container');
const leaderboardList = document.getElementById('leaderboard-list');
const totalVisitorsElement = document.getElementById('total-visitors');
const currentCountryElement = document.getElementById('country-name');
const themeToggle = document.getElementById('theme-toggle');
const panelTabs = document.querySelectorAll('.tab-button');
const panelContents = document.querySelectorAll('.panel-content');
const chatMessages = document.getElementById('chat-messages');
const usernameInput = document.getElementById('username-input');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Initialize the app
async function init() {
    try {
        // Step 1: Get IP information
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        userCountry = ipData.country_code;
        userCountryName = ipData.country_name;
        currentCountryElement.textContent = userCountryName;
        
        // Step 2: Load ignored.txt
        const ignoredResponse = await fetch('ignored.txt');
        const ignoredText = await ignoredResponse.text();
        const blockedOrgs = ignoredText.split('\n').map(line => line.trim()).filter(line => line);
        
        // Step 3: Check if org is blocked
        if (blockedOrgs.includes(ipData.org)) {
            window.location.href = 'blocked.html';
            return;
        }
        
        // Step 4: Log country to Firebase
        await logCountryVisit(userCountry);
        
        // Step 5: Generate random username
        username = `User-${Math.floor(Math.random() * 1000000)}`;
        
        // Step 6: Load all displays
        loadFlagDisplay();
        loadLeaderboard();
        loadTotalVisitors();
        
        // Initialize chat if chat tab is active
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        if (activeTab === 'chat') {
            initChat();
        }
        
        // Hide loading screen
        loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Error:', error);
        loadingElement.innerHTML = '<p>Error loading data. Please refresh.</p>';
    }
}

// Log country visit to Firebase
async function logCountryVisit(countryCode) {
    const countryRef = database.ref('countries/' + countryCode);
    
    // Get current count
    const snapshot = await countryRef.once('value');
    const currentCount = snapshot.val()?.count || 0;
    
    // Update count
    await countryRef.set({
        count: currentCount + 1,
        name: userCountryName
    });
    
    // Add to recent visits
    const visitData = {
        country: countryCode,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    await database.ref('visits').push(visitData);
}

// Load flag display
function loadFlagDisplay() {
    database.ref('visits').orderByChild('timestamp').on('value', (snapshot) => {
        flagContainer.innerHTML = '';
        
        snapshot.forEach((visitSnapshot) => {
            const visit = visitSnapshot.val();
            const flagImg = document.createElement('img');
            flagImg.src = `https://flagcdn.com/w40/${visit.country.toLowerCase()}.png`;
            flagImg.alt = visit.country;
            flagImg.title = visit.country;
            flagContainer.appendChild(flagImg);
        });
    });
}

// Load leaderboard
function loadLeaderboard() {
    database.ref('countries').orderByChild('count').on('value', (snapshot) => {
        leaderboardList.innerHTML = '';
        
        const countries = [];
        snapshot.forEach((countrySnapshot) => {
            countries.push({
                code: countrySnapshot.key,
                name: countrySnapshot.val().name,
                count: countrySnapshot.val().count
            });
        });
        
        // Sort by count (descending)
        countries.sort((a, b) => b.count - a.count);
        
        // Display all countries
        countries.forEach((country, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rank = document.createElement('div');
            rank.className = 'leaderboard-rank';
            rank.textContent = index + 1;
            
            const flag = document.createElement('img');
            flag.className = 'leaderboard-flag';
            flag.src = `https://flagcdn.com/w20/${country.code.toLowerCase()}.png`;
            flag.alt = country.code;
            
            const text = document.createElement('div');
            text.textContent = `${country.name}: ${country.count}`;
            text.style.flex = '1';
            
            item.appendChild(rank);
            item.appendChild(flag);
            item.appendChild(text);
            leaderboardList.appendChild(item);
        });
    });
}

// Load total visitors count
function loadTotalVisitors() {
    database.ref('visits').on('value', (snapshot) => {
        totalVisitorsElement.textContent = snapshot.numChildren();
    });
}

// Initialize chat functionality
function initChat() {
    if (chatInitialized) return;
    chatInitialized = true;
    
    // Load chat messages
    database.ref('chat').limitToLast(50).on('child_added', (snapshot) => {
        const message = snapshot.val();
        addMessageToChat(message);
    });
    
    // Send message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && username) {
            const messageData = {
                username: username,
                country: userCountry,
                text: messageText,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            database.ref('chat').push(messageData);
            messageInput.value = '';
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    usernameInput.addEventListener('change', (e) => {
        const newUsername = e.target.value.trim();
        if (newUsername) {
            username = newUsername;
        }
    });
}

// Add message to chat UI
function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const header = document.createElement('div');
    header.className = 'chat-message-header';
    
    const flag = document.createElement('img');
    flag.className = 'chat-user-flag';
    flag.src = `https://flagcdn.com/w20/${message.country.toLowerCase()}.png`;
    flag.alt = message.country;
    
    const usernameElement = document.createElement('span');
    usernameElement.className = 'chat-username';
    usernameElement.textContent = message.username;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'chat-timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    const text = document.createElement('div');
    text.textContent = message.text;
    
    header.appendChild(flag);
    header.appendChild(usernameElement);
    header.appendChild(timestamp);
    messageElement.appendChild(header);
    messageElement.appendChild(text);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Tab switching
panelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        panelTabs.forEach(t => t.classList.remove('active'));
        panelContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(tabName).classList.add('active');
        
        // Initialize chat if chat tab is selected
        if (tabName === 'chat' && !chatInitialized) {
            initChat();
        }
    });
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Mobile panel toggle for small screens
if (window.innerWidth <= 480) {
    const sidePanel = document.querySelector('.side-panel');
    const panelTabButtons = document.querySelectorAll('.tab-button');
    
    panelTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            sidePanel.classList.add('active');
        });
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidePanel.contains(e.target) && !Array.from(panelTabButtons).some(btn => btn.contains(e.target))) {
            sidePanel.classList.remove('active');
        }
    });
}

// Start the app
init();