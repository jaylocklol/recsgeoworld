// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnNUZc3JA51Sqq7WHth5oTBCdL5W1zTvE",
  authDomain: "chat-5cc70.firebaseapp.com",
  databaseURL:
    "https://chat-5cc70-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chat-5cc70",
  storageBucket: "chat-5cc70.firebasestorage.app",
  messagingSenderId: "506254461742",
  appId: "1:506254461742:web:970599731a09f9fea188bf",
  measurementId: "G-5F3YXJX3LN",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global variables
let countries = {};
let userCountryCode = "";
let userCountryName = "";
let userClicks = 0;
let userId = "";
let username = "";
let darkMode = false;

// DOM elements
const countrySelectSection = document.getElementById("country-select");
const detectingCountrySection = document.getElementById("detecting-country");
const gameArea = document.getElementById("game-area");
const countryDropdown = document.getElementById("country-dropdown");
const selectBtn = document.getElementById("select-btn");
const clickButton = document.getElementById("click-button");
const currentCountryName = document.getElementById("current-country-name");
const currentCountryFlag = document.getElementById("current-country-flag");
const userClicksDisplay = document.getElementById("user-clicks");
const leaderboardTable = document.getElementById("leaderboard-table");
const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardLoading = document.getElementById("leaderboard-loading");
const sidebar = document.getElementById("sidebar");
const chatAuth = document.getElementById("chat-auth");
const chatInterface = document.getElementById("chat-interface");
const chatUsername = document.getElementById("chat-username");
const chatJoin = document.getElementById("chat-join");
const chatMessages = document.getElementById("chat-messages");
const chatMessage = document.getElementById("chat-message");
const chatSend = document.getElementById("chat-send");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const chatToggle = document.getElementById("chat-toggle");
const chatClose = document.getElementById("chat-close");

// Cookie functions
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

// Initialize the app
async function init() {
  // Generate or load user ID
  userId = localStorage.getItem("userId") || generateUUID();
  localStorage.setItem("userId", userId);

  // Load username from cookie
  username = getCookie("username") || "";

  // Check for saved preferences
  darkMode = localStorage.getItem("darkMode") === "true";
  if (darkMode) {
    document.body.classList.add("dark-mode");
  }

  const chatOpen = localStorage.getItem("chatOpen") === "true";
  if (chatOpen) {
    sidebar.classList.add("open");
  }

  // Load country data
  await loadCountries();

  // Try to detect user's country
  await detectCountry();

  // Set up event listeners
  setupEventListeners();

  // Set up real-time listeners
  setupLeaderboardListener();
}

function setupEventListeners() {
  selectBtn.addEventListener("click", selectCountry);
  clickButton.addEventListener("click", registerClick);
  darkModeToggle.addEventListener("click", toggleDarkMode);
  chatJoin.addEventListener("click", joinChat);
  chatSend.addEventListener("click", sendMessage);
  chatMessage.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  chatToggle.addEventListener("click", toggleChat);
  chatClose.addEventListener("click", closeChat);
}

// Generate UUID for user identification
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Load all countries from flagcdn.com
async function loadCountries() {
  try {
    const response = await fetch("https://country-clicker-game.glitch.me/nigga-stop-looking.json");
    countries = await response.json();

    // Populate dropdown
    countryDropdown.innerHTML =
      '<option value="">-- Select Country --</option>';
    for (const [code, name] of Object.entries(countries)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      countryDropdown.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load countries:", error);
  }
}

// Detect user's country using ipapi.co
async function detectCountry() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    // Check for AVAST VPN
if (data.org && (data.org.toUpperCase().includes("AVAST SOFTWARE S.R.O.") || data.org.toUpperCase().includes("CLOUDFLARENET"))) {
      document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e74c3c;">VPN Detected</h1>
                    <p style="font-size: 1.2em;">
                        Hello! VPNs are allowed on this website, but we have decided to block 
                        HMA VPN/AVAST VPN/Cloudflare Warp Any Other VPN That Uses AVAST Software s.r.o./CLOUDFLARENET, 
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

      // Load user's clicks from Firebase
      await loadUserClicks();

      // Show game area and chat
      detectingCountrySection.classList.add("hidden");
      updateCurrentCountryDisplay();
      gameArea.classList.remove("hidden");
      showChatAuth();
    } else {
      // If detection fails, show country selection
      detectingCountrySection.textContent =
        "Could not detect your country. Please select it manually.";
      detectingCountrySection.classList.remove("loading");
      countrySelectSection.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Failed to detect country:", error);
    detectingCountrySection.textContent =
      "Could not detect your country. Please select it manually.";
    detectingCountrySection.classList.remove("loading");
    countrySelectSection.classList.remove("hidden");
  }
}
// Handle country selection
async function selectCountry() {
  const selectedCode = countryDropdown.value;
  if (!selectedCode) return;

  userCountryCode = "GB";
  userCountryName = "United Kingdom";

  // Load user's clicks from Firebase
  await loadUserClicks();

  // Show game area and chat
  countrySelectSection.classList.add("hidden");
  updateCurrentCountryDisplay();
  gameArea.classList.remove("hidden");
  showChatAuth();
}

// Show chat authentication
function showChatAuth() {
  sidebar.classList.remove("hidden");
  if (username) {
    joinChat();
  } else {
    chatAuth.classList.remove("hidden");
    chatInterface.classList.add("hidden");
  }
}

// Join chat with username
function joinChat() {
  username = chatUsername.value.trim() || username;
  if (!username) return;

  // Save username to cookie (expires in 30 days)
  setCookie("username", username, 30);

  // Set up chat interface
  chatAuth.classList.add("hidden");
  chatInterface.classList.remove("hidden");

  // Set up chat listener with message limit
  database
    .ref("chat")
    .orderByChild("timestamp")
    .limitToLast(100)
    .on("child_added", (snapshot) => {
      const message = snapshot.val();
      addMessageToChat(message);
    });

  // Set up cleanup listener
  database
    .ref("chat")
    .orderByChild("timestamp")
    .on("value", (snapshot) => {
      const messages = snapshot.val();
      if (!messages) return;

      const messageKeys = Object.keys(messages);
      if (messageKeys.length > 100) {
        // Get the oldest messages to delete
        const messagesArray = Object.entries(messages).map(([key, value]) => ({
          key,
          timestamp: value.timestamp,
        }));

        messagesArray.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate how many to delete
        const toDelete = messagesArray.length - 100;
        for (let i = 0; i < toDelete; i++) {
          database.ref("chat/" + messagesArray[i].key).remove();
        }
      }
    });
}

// Send chat message
function sendMessage() {
  const messageText = chatMessage.value.trim();
  if (!messageText || !username) return;

  const message = {
    userId,
    username,
    countryCode: userCountryCode,
    countryName: userCountryName,
    text: messageText,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };

  // Push message to Firebase
  database.ref("chat").push(message);

  // Clear input
  chatMessage.value = "";
}

// Add message to chat UI
function addMessageToChat(message) {
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  messageElement.innerHTML = `
    <div class="message-header">
        <img src="https://flagcdn.com/w20/${message.countryCode}.png" width="20" alt="${message.countryName}" class="message-flag">
        ${message.username}
    </div>
    <div class="message-text">${message.text}</div>
`;

  chatMessages.appendChild(messageElement);

  // Auto-scroll only if user is near bottom
  const isNearBottom =
    chatMessages.scrollHeight -
      chatMessages.clientHeight -
      chatMessages.scrollTop <
    100;
  if (isNearBottom) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Keep only the most recent 100 messages in the UI
  const messages = chatMessages.querySelectorAll(".message");
  if (messages.length > 100) {
    chatMessages.removeChild(messages[0]);
  }
}

// Toggle chat visibility
function toggleChat() {
  sidebar.classList.toggle("open");
  localStorage.setItem("chatOpen", sidebar.classList.contains("open"));
}

// Close chat
function closeChat() {
  sidebar.classList.remove("open");
  localStorage.setItem("chatOpen", false);
}

// Update the current country display
function updateCurrentCountryDisplay() {
  currentCountryName.textContent = userCountryName;
  currentCountryFlag.innerHTML = `<img src="https://flagcdn.com/w80/${userCountryCode}.png" width="35" alt="${userCountryName}">`;
  userClicksDisplay.textContent = userClicks.toLocaleString();
}

// Load user's clicks from Firebase
async function loadUserClicks() {
  try {
    const snapshot = await database
      .ref(`countries/${userCountryCode}`)
      .once("value");
    const countryData = snapshot.val();
    userClicks = countryData ? countryData.clicks : 0;
    updateCurrentCountryDisplay();
  } catch (error) {
    console.error("Error loading user clicks:", error);
    userClicks = 0;
  }
}

// Register a click for the user's country
async function registerClick() {
  userClicks++;
  userClicksDisplay.textContent = userClicks.toLocaleString();

  // Animation effect
  clickButton.style.transform = "scale(0.95)";
  setTimeout(() => {
    clickButton.style.transform = "scale(1)";
  }, 100);

  // Update Firebase
  try {
    await database.ref(`countries/${userCountryCode}`).set({
      name: userCountryName,
      code: userCountryCode,
      clicks: userClicks,
      lastUpdated: firebase.database.ServerValue.TIMESTAMP,
    });
  } catch (error) {
    console.error("Error updating clicks:", error);
  }
}

// Set up real-time leaderboard listener
function setupLeaderboardListener() {
  database
    .ref("countries")
    .orderByChild("clicks")
    .on("value", (snapshot) => {
      const countriesData = snapshot.val();
      updateLeaderboard(countriesData);
    });
}

// Update the leaderboard
function updateLeaderboard(countriesData) {
  if (!countriesData) {
    leaderboardBody.innerHTML =
      '<tr><td colspan="4">No data available</td></tr>';
    return;
  }

  // Convert to array and sort
  const leaderboard = [];
  for (const [code, data] of Object.entries(countriesData)) {
    if (countries[code]) {
      leaderboard.push({
        code,
        name: data.name || countries[code],
        clicks: data.clicks || 0,
      });
    }
  }

  leaderboard.sort((a, b) => b.clicks - a.clicks);

  // Update table
  leaderboardBody.innerHTML = "";
  leaderboard.forEach((country, index) => {
    const row = document.createElement("tr");

    // Highlight user's country
    if (country.code === userCountryCode) {
      row.classList.add("user-row");
    }

    row.innerHTML = `
    <td>${index + 1}</td>
    <td class="flag-cell"><img src="https://flagcdn.com/w40/${
      country.code
    }.png" width="40" alt="${country.name}"></td>
    <td>${country.name}</td>
    <td>${country.clicks.toLocaleString()}</td>
`;

    leaderboardBody.appendChild(row);
  });

  // Show table
  leaderboardLoading.classList.add("hidden");
  leaderboardTable.classList.remove("hidden");
}

// Toggle dark mode
function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle("dark-mode", darkMode);
  localStorage.setItem("darkMode", darkMode);
}

// Start the app
init();
