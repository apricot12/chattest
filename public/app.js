// Chat elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');

// Tab elements
const chatTab = document.getElementById('chatTab');
const calendarTab = document.getElementById('calendarTab');
const toggleLayoutBtn = document.getElementById('toggleLayoutBtn');
const chatSection = document.querySelector('.chat-section');
const calendarSection = document.getElementById('calendarSection');

// Calendar elements
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthDisplay = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const addEventBtn = document.getElementById('addEventBtn');
const upcomingEvents = document.getElementById('upcomingEvents');

// Modal elements
const eventModal = document.getElementById('eventModal');
const modalTitle = document.getElementById('modalTitle');
const eventForm = document.getElementById('eventForm');
const closeModal = document.querySelector('.close');
const cancelEventBtn = document.getElementById('cancelEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');

// Day view modal elements
const dayViewModal = document.getElementById('dayViewModal');
const dayViewTitle = document.getElementById('dayViewTitle');
const dayViewEvents = document.getElementById('dayViewEvents');
const closeDayView = document.querySelector('.close-day-view');
const addEventFromDayBtn = document.getElementById('addEventFromDayBtn');

// Get or create persistent session ID
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
}

// Calendar state
let currentDate = new Date();
let currentEditingEvent = null;
let calendarEvents = [];
let selectedDate = null;

// Local storage keys
const STORAGE_KEY = 'personal-assistant-chat-messages';
const EVENTS_STORAGE_KEY = 'personal-assistant-calendar-events';
const LAYOUT_PREFERENCE_KEY = 'personal-assistant-layout-preference';

// Layout state
let isSideBySideLayout = false;

// Load chat history from local storage
function loadChatHistory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const messages = JSON.parse(saved);
            messages.forEach(msg => {
                appendMessage(msg.role, msg.content, false);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
}

// Save events to local storage
function saveEventsToStorage(events) {
    try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify({
            sessionId: sessionId,
            events: events,
            lastUpdated: Date.now()
        }));
    } catch (error) {
        console.error('Error saving events to local storage:', error);
    }
}

// Load events from local storage
function loadEventsFromStorage() {
    try {
        const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            // Only load if it's the same session
            if (data.sessionId === sessionId) {
                return data.events || [];
            }
        }
    } catch (error) {
        console.error('Error loading events from local storage:', error);
    }
    return [];
}

// Save message to local storage
function saveMessageToStorage(role, content) {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const messages = saved ? JSON.parse(saved) : [];
        messages.push({ role, content, timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

// Send message on button click
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Clear chat
clearBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the chat?')) {
        // Remove all messages except welcome message
        const messages = chatContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());

        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);

        // Clear on server
        try {
            await fetch('/api/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    }
});

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    // Disable input while processing
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Display user message
    appendMessage('user', message);
    messageInput.value = '';

    // Show typing indicator
    const typingIndicator = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();

        // Remove typing indicator
        typingIndicator.remove();

        // Display assistant response
        appendMessage('assistant', data.response);

        // Reload calendar if event-related intent
        if (['SCHEDULE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT'].includes(data.intent.type)) {
            await loadCalendarEvents();

            // Optionally auto-open calendar to show the created/updated event
            if (!calendarSection.classList.contains('active-view') && !isSideBySideLayout) {
                calendarTab.click();
            }
        }

    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        appendMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Simple markdown to HTML converter
function parseMarkdown(text) {
    // Escape HTML to prevent XSS
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // Split into lines for processing
    let lines = text.split('\n');
    let html = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Headers (must be at start of line)
        if (line.match(/^### /)) {
            line = '<h3>' + escapeHtml(line.substring(4)) + '</h3>';
        } else if (line.match(/^## /)) {
            line = '<h2>' + escapeHtml(line.substring(3)) + '</h2>';
        } else if (line.match(/^# /)) {
            line = '<h1>' + escapeHtml(line.substring(2)) + '</h1>';
        }
        // Unordered list
        else if (line.match(/^- /)) {
            if (!inList) {
                html.push('<ul>');
                inList = true;
            }
            line = '<li>' + escapeHtml(line.substring(2)) + '</li>';
        }
        // Numbered list
        else if (line.match(/^\d+\. /)) {
            const match = line.match(/^\d+\. (.*)/);
            if (!inList) {
                html.push('<ol>');
                inList = true;
            }
            line = '<li>' + escapeHtml(match[1]) + '</li>';
        } else {
            // Close list if we were in one
            if (inList) {
                html.push('</ul></ol>'); // Close both to handle either type
                inList = false;
            }
            // Empty line becomes paragraph break
            if (line.trim() === '') {
                line = '<br>';
            } else {
                line = escapeHtml(line);
            }
        }

        html.push(line);
    }

    // Close list if still open
    if (inList) {
        html.push('</ul></ol>');
    }

    // Join lines
    let result = html.join('\n');

    // Convert inline formatting (after escaping)
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    return result;
}

function appendMessage(role, content, saveToStorage = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Render markdown for assistant messages, plain text for user
    if (role === 'assistant') {
        contentDiv.innerHTML = parseMarkdown(content);
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Save to local storage
    if (saveToStorage) {
        saveMessageToStorage(role, content);
    }
}

function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';

    messageDiv.appendChild(typingDiv);
    chatContainer.appendChild(messageDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
}

// Tab and Layout functionality

// Switch to chat view
chatTab.addEventListener('click', () => {
    if (!isSideBySideLayout) {
        chatTab.classList.add('active');
        calendarTab.classList.remove('active');
        chatSection.classList.add('active-view');
        calendarSection.classList.remove('active-view');
    }
});

// Switch to calendar view
calendarTab.addEventListener('click', () => {
    if (!isSideBySideLayout) {
        calendarTab.classList.add('active');
        chatTab.classList.remove('active');
        calendarSection.classList.add('active-view');
        chatSection.classList.remove('active-view');
    }
    // Always render and load calendar when switching to it
    renderCalendar();
    loadCalendarEvents();
});

// Toggle between tab and side-by-side layout
toggleLayoutBtn.addEventListener('click', () => {
    isSideBySideLayout = !isSideBySideLayout;
    const appContainer = document.querySelector('.app-container');

    if (isSideBySideLayout) {
        appContainer.classList.add('side-by-side');
        chatSection.classList.add('active-view');
        calendarSection.classList.add('active-view');
        toggleLayoutBtn.textContent = '📱';
        toggleLayoutBtn.title = 'Switch to tab view';
        // Both tabs appear active in side-by-side mode
        chatTab.classList.add('active');
        calendarTab.classList.add('active');
    } else {
        appContainer.classList.remove('side-by-side');
        toggleLayoutBtn.textContent = '⚡';
        toggleLayoutBtn.title = 'Toggle side-by-side view';
        // Restore tab state
        if (chatTab.classList.contains('active')) {
            chatSection.classList.add('active-view');
            calendarSection.classList.remove('active-view');
        } else {
            chatSection.classList.remove('active-view');
            calendarSection.classList.add('active-view');
        }
    }

    // Save preference
    localStorage.setItem(LAYOUT_PREFERENCE_KEY, isSideBySideLayout);

    // Re-render calendar if visible
    if (calendarSection.classList.contains('active-view')) {
        renderCalendar();
    }
});

// Load layout preference
function loadLayoutPreference() {
    const saved = localStorage.getItem(LAYOUT_PREFERENCE_KEY);
    if (saved === 'true' && window.innerWidth >= 1024) {
        // Only apply side-by-side on larger screens
        toggleLayoutBtn.click();
    }
}

// Calendar functionality

// Calendar navigation
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
});

// Add event button
addEventBtn.addEventListener('click', () => {
    openEventModal();
});

// Modal controls
closeModal.addEventListener('click', () => {
    eventModal.classList.remove('show');
});

cancelEventBtn.addEventListener('click', () => {
    eventModal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        eventModal.classList.remove('show');
    }
    if (e.target === dayViewModal) {
        dayViewModal.classList.remove('show');
    }
});

// Day view modal controls
closeDayView.addEventListener('click', () => {
    dayViewModal.classList.remove('show');
});

addEventFromDayBtn.addEventListener('click', () => {
    dayViewModal.classList.remove('show');
    openEventModal(selectedDate);
});

// Event form submission
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEvent();
});

// Delete event
deleteEventBtn.addEventListener('click', async () => {
    if (currentEditingEvent && confirm('Are you sure you want to delete this event?')) {
        await deleteEvent(currentEditingEvent.id);
    }
});

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Clear existing days (keep headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(el => el.remove());

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true, new Date(year, month - 1, day));
        calendarGrid.appendChild(dayEl);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEl = createDayElement(day, false, date);
        calendarGrid.appendChild(dayEl);
    }

    // Add next month's leading days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, true, new Date(year, month + 1, day));
        calendarGrid.appendChild(dayEl);
    }
}

function createDayElement(day, isOtherMonth, date) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');

    // Check if today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayEl.classList.add('today');
    }

    // Check for events
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
        dayEl.classList.add('has-events');
    }

    dayEl.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-day-events">
            ${dayEvents.slice(0, 3).map(() => '<div class="event-dot"></div>').join('')}
        </div>
    `;

    dayEl.addEventListener('click', () => {
        openDayView(date);
    });

    return dayEl;
}

function getEventsForDate(date) {
    return calendarEvents.filter(event => {
        const eventDate = new Date(event.startDateTime);
        return eventDate.toDateString() === date.toDateString();
    });
}

// Load calendar events from API and sync with localStorage
async function loadCalendarEvents() {
    try {
        // First, try to load from localStorage
        const localEvents = loadEventsFromStorage();

        // Fetch from server
        const response = await fetch(`/api/calendar/events?sessionId=${sessionId}`);
        const data = await response.json();
        const serverEvents = data.events || [];

        // Merge server events with local events (server takes priority for conflicts)
        // Use a Map to deduplicate by event ID
        const eventsMap = new Map();

        // Add local events first
        localEvents.forEach(event => eventsMap.set(event.id, event));

        // Add/override with server events
        serverEvents.forEach(event => eventsMap.set(event.id, event));

        // Convert back to array
        calendarEvents = Array.from(eventsMap.values());

        // Save merged events to localStorage
        saveEventsToStorage(calendarEvents);

        renderCalendar();
        renderUpcomingEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        // If server fetch fails, try to use localStorage as fallback
        calendarEvents = loadEventsFromStorage();
        renderCalendar();
        renderUpcomingEvents();
    }
}

// Render upcoming events list
function renderUpcomingEvents() {
    const now = new Date();
    const upcoming = calendarEvents
        .filter(event => new Date(event.startDateTime) >= now)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
        .slice(0, 10);

    if (upcoming.length === 0) {
        upcomingEvents.innerHTML = '<p style="color: #909090;">No upcoming events</p>';
        return;
    }

    upcomingEvents.innerHTML = upcoming.map(event => {
        const startDate = new Date(event.startDateTime);
        const endDate = new Date(event.endDateTime);
        return `
            <div class="event-card" onclick="editEvent('${event.id}')">
                <div class="event-card-header">
                    <div class="event-card-title">${event.title}</div>
                    <div class="event-card-category">${event.category}</div>
                </div>
                <div class="event-card-time">
                    ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                ${event.location ? `<div class="event-card-location">📍 ${event.location}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Open day view modal
function openDayView(date) {
    selectedDate = date;
    const dayEvents = getEventsForDate(date);

    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    dayViewTitle.textContent = dateStr;

    if (dayEvents.length === 0) {
        dayViewEvents.innerHTML = '<div class="day-view-empty">No events scheduled for this day</div>';
    } else {
        dayViewEvents.innerHTML = dayEvents.map(event => {
            const startDate = new Date(event.startDateTime);
            const endDate = new Date(event.endDateTime);
            return `
                <div class="event-card" onclick="editEvent('${event.id}')">
                    <div class="event-card-header">
                        <div class="event-card-title">${event.title}</div>
                        <div class="event-card-category">${event.category}</div>
                    </div>
                    <div class="event-card-time">
                        ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    ${event.description ? `<div class="event-card-location">${event.description}</div>` : ''}
                    ${event.location ? `<div class="event-card-location">📍 ${event.location}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    dayViewModal.classList.add('show');
}

// Open event modal
function openEventModal(date = null) {
    currentEditingEvent = null;
    modalTitle.textContent = 'Add Event';
    deleteEventBtn.style.display = 'none';
    eventForm.reset();

    if (date) {
        const dateStr = date.toISOString().split('T')[0];
        document.getElementById('eventStartDate').value = dateStr;
        document.getElementById('eventEndDate').value = dateStr;
        document.getElementById('eventStartTime').value = '09:00';
        document.getElementById('eventEndTime').value = '10:00';
    } else {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);
        document.getElementById('eventStartDate').value = dateStr;
        document.getElementById('eventEndDate').value = dateStr;
        document.getElementById('eventStartTime').value = timeStr;
        const endTime = new Date(now.getTime() + 60 * 60000).toTimeString().slice(0, 5);
        document.getElementById('eventEndTime').value = endTime;
    }

    eventModal.classList.add('show');
}

// Edit event
window.editEvent = async function(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) return;

    // Close day view modal if open
    dayViewModal.classList.remove('show');

    currentEditingEvent = event;
    modalTitle.textContent = 'Edit Event';
    deleteEventBtn.style.display = 'block';

    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('eventStartTime').value = startDate.toTimeString().slice(0, 5);
    document.getElementById('eventEndDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('eventEndTime').value = endDate.toTimeString().slice(0, 5);
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventCategory').value = event.category || 'personal';
    document.getElementById('eventRecurrence').value = event.recurrence || 'none';
    document.getElementById('eventId').value = event.id;

    eventModal.classList.add('show');
};

// Save event
async function saveEvent() {
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const startDate = document.getElementById('eventStartDate').value;
    const startTime = document.getElementById('eventStartTime').value;
    const endDate = document.getElementById('eventEndDate').value;
    const endTime = document.getElementById('eventEndTime').value;
    const location = document.getElementById('eventLocation').value;
    const category = document.getElementById('eventCategory').value;
    const recurrence = document.getElementById('eventRecurrence').value;

    const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

    const eventData = {
        title,
        description,
        startDateTime,
        endDateTime,
        location,
        category,
        recurrence
    };

    try {
        let response;
        if (currentEditingEvent) {
            // Update existing event
            response = await fetch(`/api/calendar/events/${currentEditingEvent.id}?sessionId=${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: eventData })
            });
        } else {
            // Create new event
            response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, event: eventData })
            });
        }

        if (response.ok) {
            eventModal.classList.remove('show');
            await loadCalendarEvents();
        } else {
            alert('Failed to save event');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event');
    }
}

// Delete event
async function deleteEvent(eventId) {
    try {
        const response = await fetch(`/api/calendar/events/${eventId}?sessionId=${sessionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            eventModal.classList.remove('show');
            await loadCalendarEvents();
        } else {
            alert('Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
    }
}

// Load chat history and focus input on load
loadChatHistory();
messageInput.focus();

// Load events from localStorage on startup (for offline access)
calendarEvents = loadEventsFromStorage();

// Load layout preference on startup
loadLayoutPreference();
