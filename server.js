const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const chrono = require('chrono-node');
require('dotenv').config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  console.error('Please create a .env file with your OpenAI API key');
  console.error('See .env.example for reference');
  process.exit(1);
}

// Helper function to convert Date to ISO-like string preserving local time
function toLocalISOString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper function to parse natural language dates using chrono-node
function parseNaturalLanguageDate(text, referenceDate = new Date()) {
  const results = chrono.parse(text, referenceDate, { forwardDate: true });
  if (results && results.length > 0) {
    const result = results[0];
    return {
      start: result.start.date(),
      end: result.end ? result.end.date() : null,
      text: result.text
    };
  }
  return null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function getIntentSystemPrompt(currentDateTime) {
  return `
You are an intent recognition system for a personal assistant app.
Analyze user messages and identify their intent along with relevant entities.

IMPORTANT: The current date and time is ${currentDateTime}.
When the user says "tomorrow", "next week", "today", etc., calculate the actual date based on this current date/time.
For example, if today is ${currentDateTime} and user says "tomorrow at 2pm", the date should be the day after ${currentDateTime.split('T')[0]}.

Intent Types:
- CREATE_TASK: User wants to create a new task or to-do item
- BREAKDOWN_TASK: User wants to break down a complex task into subtasks
- UPDATE_TASK: User wants to modify an existing task
- SCHEDULE_EVENT: User wants to schedule something on calendar (create calendar event)
- UPDATE_EVENT: User wants to modify or reschedule an existing calendar event
- DELETE_EVENT: User wants to cancel or delete a calendar event
- VIEW_CALENDAR: User wants to see their calendar or upcoming events
- GET_RECIPE: User is asking for cooking help or recipes
- SUGGEST_SCHEDULE: User wants scheduling suggestions for a task
- GENERAL_QUERY: General questions or conversation

Extract entities like:
- Task names and descriptions
- Event titles and descriptions
- Dates and times (convert to ISO format, include both start and end if mentioned)
- Duration (in minutes)
- Priority levels (LOW, MEDIUM, HIGH)
- Categories (work, personal, shopping, cooking, appointment, meeting, etc.)
- Locations
- Recurrence (none, daily, weekly, monthly, yearly)

Respond with JSON only:
{
  "type": "INTENT_TYPE",
  "confidence": 0.0-1.0,
  "entities": {
    "title": "event or task title",
    "description": "detailed description",
    "startDateTime": "ISO_DATE_STRING",
    "endDateTime": "ISO_DATE_STRING",
    "duration": minutes_as_number,
    "priority": "HIGH|MEDIUM|LOW",
    "category": "category_name",
    "location": "location_if_mentioned",
    "recurrence": "none|daily|weekly|monthly|yearly"
  }
}
`;
}

const TASK_BREAKDOWN_PROMPT = `
You are a task breakdown specialist. When given a complex task, break it down into smaller, actionable subtasks.

Guidelines:
- Create 3-8 subtasks maximum
- Each subtask should be specific and actionable
- Estimate duration in minutes
- Order subtasks logically
- Consider dependencies between tasks

For cooking tasks, include prep, cooking, and cleanup phases.
For planning tasks, include research, booking, preparation phases.
For work projects, include planning, execution, and review phases.

Respond with JSON only:
{
  "mainTask": {
    "title": "refined_main_task_title",
    "description": "detailed_description",
    "estimatedDuration": total_minutes,
    "category": "category"
  },
  "subtasks": [
    {
      "title": "subtask_title",
      "description": "what_exactly_to_do",
      "estimatedDuration": minutes,
      "order": 1
    }
  ]
}
`;

const COOKING_SYSTEM_PROMPT = `
You are a helpful cooking assistant. Provide practical cooking advice, recipes, and meal planning help.

When asked about recipes:
- Start with the recipe name as a header (## Recipe Name)
- List ingredients with quantities in a simple bulleted list
- Give step-by-step instructions numbered clearly
- Include prep and cooking times
- Suggest variations or substitutions if relevant
- Consider dietary restrictions if mentioned

When asked about meal planning:
- Suggest balanced meals
- Consider time constraints
- Provide grocery lists
- Suggest meal prep strategies

Keep formatting clean and readable. Use simple markdown: headers (##), bold (**text**), and lists (- or 1.).
Avoid excessive emojis or special characters.
`;

const SCHEDULING_PROMPT = `
You are a smart scheduling assistant. Given a task and the user's existing calendar, suggest optimal times to schedule the task.

Consider:
- Task duration and complexity
- User's energy levels throughout the day
- Existing commitments
- Task priority and deadline
- Logical grouping of similar tasks

Respond with JSON only:
{
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTime": "HH:MM",
  "reasoning": "why_this_time_is_optimal",
  "alternatives": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "reason": "alternative_reasoning"
    }
  ]
}
`;

// Calendar helper functions
function generateEventId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getCalendarEvents(sessionId) {
  if (!calendarEvents.has(sessionId)) {
    calendarEvents.set(sessionId, []);
  }
  return calendarEvents.get(sessionId);
}

function createEvent(sessionId, eventData) {
  const events = getCalendarEvents(sessionId);
  const newEvent = {
    id: generateEventId(),
    title: eventData.title,
    description: eventData.description || '',
    startDateTime: eventData.startDateTime,
    endDateTime: eventData.endDateTime,
    location: eventData.location || '',
    category: eventData.category || 'personal',
    reminderMinutes: eventData.reminderMinutes || 30,
    recurrence: eventData.recurrence || 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  events.push(newEvent);
  return newEvent;
}

function updateEvent(sessionId, eventId, updates) {
  const events = getCalendarEvents(sessionId);
  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return null;

  events[eventIndex] = {
    ...events[eventIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return events[eventIndex];
}

function deleteEvent(sessionId, eventId) {
  const events = getCalendarEvents(sessionId);
  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return false;

  events.splice(eventIndex, 1);
  return true;
}

function findEventsByDateRange(sessionId, startDate, endDate) {
  const events = getCalendarEvents(sessionId);
  return events.filter(event => {
    const eventStart = new Date(event.startDateTime);
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    return eventStart >= rangeStart && eventStart <= rangeEnd;
  }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
}

function findEventsByTitle(sessionId, titleSearch) {
  const events = getCalendarEvents(sessionId);
  return events.filter(event =>
    event.title.toLowerCase().includes(titleSearch.toLowerCase())
  );
}

// Helper functions for formatting responses
function formatTaskBreakdown(data) {
  const { mainTask, subtasks } = data;
  let response = `## Task Breakdown\n\n`;
  response += `**${mainTask.title}**\n\n`;
  response += `${mainTask.description}\n\n`;
  response += `**Total Time:** ${mainTask.estimatedDuration} minutes\n`;
  response += `**Category:** ${mainTask.category}\n\n`;
  response += `### Subtasks:\n\n`;

  subtasks.forEach((subtask) => {
    response += `${subtask.order}. **${subtask.title}** (${subtask.estimatedDuration} min)\n`;
    response += `   ${subtask.description}\n\n`;
  });

  return response;
}

function formatSchedulingSuggestion(data) {
  let response = `## Scheduling Suggestion\n\n`;
  response += `**Recommended Time:** ${data.suggestedDate} at ${data.suggestedTime}\n\n`;
  response += `**Why this time?**\n${data.reasoning}\n\n`;

  if (data.alternatives && data.alternatives.length > 0) {
    response += `**Alternative Options:**\n\n`;
    data.alternatives.forEach((alt, index) => {
      response += `${index + 1}. ${alt.date} at ${alt.time}\n`;
      response += `   ${alt.reason}\n\n`;
    });
  }

  return response;
}

function formatRecipeResponse(content) {
  // Keep the response clean - just return as-is
  // The AI will handle formatting through its system prompt
  return content;
}

function formatGeneralResponse(content) {
  // Return content as-is with clean formatting
  return content;
}

function formatEventCreated(event) {
  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);

  let response = `## ✓ Event Created\n\n`;
  response += `**${event.title}**\n\n`;
  if (event.description) response += `${event.description}\n\n`;
  response += `**When:** ${startDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}\n`;
  response += `**Until:** ${endDate.toLocaleString('en-US', { timeStyle: 'short' })}\n`;
  if (event.location) response += `**Where:** ${event.location}\n`;
  response += `**Category:** ${event.category}\n`;
  if (event.recurrence !== 'none') response += `**Repeats:** ${event.recurrence}\n`;
  response += `\nEvent ID: \`${event.id}\``;

  return response;
}

function formatCalendarView(events, title = 'Your Calendar') {
  if (events.length === 0) {
    return `## ${title}\n\nNo events found.`;
  }

  let response = `## ${title}\n\n`;
  response += `Found ${events.length} event${events.length > 1 ? 's' : ''}:\n\n`;

  events.forEach((event, index) => {
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    response += `### ${index + 1}. ${event.title}\n`;
    if (event.description) response += `${event.description}\n\n`;
    response += `**When:** ${startDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}\n`;
    response += `**Duration:** ${startDate.toLocaleString('en-US', { timeStyle: 'short' })} - ${endDate.toLocaleString('en-US', { timeStyle: 'short' })}\n`;
    if (event.location) response += `**Where:** ${event.location}\n`;
    response += `**Category:** ${event.category}\n`;
    if (event.recurrence !== 'none') response += `**Repeats:** ${event.recurrence}\n`;
    response += `*Event ID: ${event.id}*\n\n`;
  });

  return response;
}

function formatEventUpdated(event) {
  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);

  let response = `## ✓ Event Updated\n\n`;
  response += `**${event.title}**\n\n`;
  if (event.description) response += `${event.description}\n\n`;
  response += `**When:** ${startDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}\n`;
  response += `**Until:** ${endDate.toLocaleString('en-US', { timeStyle: 'short' })}\n`;
  if (event.location) response += `**Where:** ${event.location}\n`;

  return response;
}

function formatEventDeleted() {
  return `## ✓ Event Deleted\n\nThe event has been removed from your calendar.`;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint for deployment platforms
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In-memory storage for conversation history
const conversationHistory = new Map();

// In-memory storage for calendar events
const calendarEvents = new Map(); // sessionId -> [events]

// Calendar event structure:
// {
//   id: string (UUID),
//   title: string,
//   description: string,
//   startDateTime: ISO date string,
//   endDateTime: ISO date string,
//   location: string (optional),
//   category: string (work, personal, appointment, etc.),
//   reminderMinutes: number (optional),
//   recurrence: string (none, daily, weekly, monthly, yearly),
//   createdAt: ISO date string,
//   updatedAt: ISO date string
// }

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history for this session
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId);

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Call OpenAI to recognize intent with conversation context
    const currentDateTime = new Date().toISOString();
    const intentMessages = [
      { role: 'system', content: getIntentSystemPrompt(currentDateTime) },
      ...history.slice(-6) // Include last 6 messages for context (3 exchanges)
    ];

    const intentResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: intentMessages,
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const intentData = JSON.parse(intentResponse.choices[0].message.content);

    // Handle different intents with specialized prompts
    let assistantMessage;
    let specializedData = null;

    switch (intentData.type) {
      case 'BREAKDOWN_TASK':
        // Use task breakdown prompt with context
        const breakdownMessages = [
          { role: 'system', content: TASK_BREAKDOWN_PROMPT },
          ...history.slice(-4), // Include recent context
        ];

        const breakdownResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: breakdownMessages,
          response_format: { type: 'json_object' },
          temperature: 0.5
        });
        specializedData = JSON.parse(breakdownResponse.choices[0].message.content);

        // Generate friendly response
        assistantMessage = formatTaskBreakdown(specializedData);
        break;

      case 'GET_RECIPE':
        // Use cooking assistant prompt with context
        const recipeMessages = [
          { role: 'system', content: COOKING_SYSTEM_PROMPT },
          ...history.slice(-6), // Include conversation context
        ];

        const recipeResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: recipeMessages,
          temperature: 0.7
        });
        assistantMessage = formatRecipeResponse(recipeResponse.choices[0].message.content);
        break;

      case 'SUGGEST_SCHEDULE':
        // Use scheduling prompt with context
        const scheduleMessages = [
          { role: 'system', content: SCHEDULING_PROMPT },
          ...history.slice(-4), // Include recent context
          { role: 'user', content: `Current date and time: ${new Date().toISOString()}` }
        ];

        const scheduleResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: scheduleMessages,
          response_format: { type: 'json_object' },
          temperature: 0.5
        });
        specializedData = JSON.parse(scheduleResponse.choices[0].message.content);

        // Generate friendly response
        assistantMessage = formatSchedulingSuggestion(specializedData);
        break;

      case 'SCHEDULE_EVENT':
        // Create calendar event from entities
        const { entities } = intentData;

        // Use chrono-node to parse dates from the original user message
        // This is more reliable than asking the AI to do it
        const parsedDate = parseNaturalLanguageDate(message);

        if (!entities.title) {
          assistantMessage = "I need more information to create the event. Please provide at least a title.";
        } else if (!parsedDate || !parsedDate.start) {
          assistantMessage = "I couldn't understand the date and time. Please specify when you'd like to schedule this event.";
        } else {
          // Use the parsed date from chrono-node instead of AI's attempt
          // Preserve local time (don't convert to UTC) to avoid date/time shifting
          const startDateTime = toLocalISOString(parsedDate.start);

          // Calculate end time
          let endDateTime;
          if (parsedDate.end) {
            // If chrono found an end time (e.g., "2pm to 4pm"), use it
            endDateTime = toLocalISOString(parsedDate.end);
          } else if (entities.duration) {
            // Use duration if specified
            const endDate = new Date(parsedDate.start.getTime() + entities.duration * 60000);
            endDateTime = toLocalISOString(endDate);
          } else {
            // Default to 1 hour
            const endDate = new Date(parsedDate.start.getTime() + 60 * 60000);
            endDateTime = toLocalISOString(endDate);
          }

          const newEvent = createEvent(sessionId, {
            title: entities.title,
            description: entities.description || '',
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            location: entities.location || '',
            category: entities.category || 'meeting',
            recurrence: entities.recurrence || 'none'
          });

          specializedData = newEvent;
          assistantMessage = formatEventCreated(newEvent);
        }
        break;

      case 'VIEW_CALENDAR':
        // Get calendar events
        const now = new Date();
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days

        const upcomingEvents = findEventsByDateRange(sessionId, now.toISOString(), futureDate.toISOString());
        assistantMessage = formatCalendarView(upcomingEvents, 'Upcoming Events (Next 30 Days)');
        specializedData = { events: upcomingEvents };
        break;

      case 'UPDATE_EVENT':
        // Find and update event
        const searchTitle = intentData.entities.title;
        const matchingEvents = findEventsByTitle(sessionId, searchTitle);

        if (matchingEvents.length === 0) {
          assistantMessage = `I couldn't find any events matching "${searchTitle}". Please check the title or event ID.`;
        } else if (matchingEvents.length > 1) {
          assistantMessage = `I found ${matchingEvents.length} events matching "${searchTitle}":\n\n`;
          matchingEvents.forEach((event, i) => {
            assistantMessage += `${i + 1}. ${event.title} (ID: ${event.id}) - ${new Date(event.startDateTime).toLocaleString()}\n`;
          });
          assistantMessage += `\nPlease specify which event you'd like to update by providing the event ID.`;
        } else {
          const eventToUpdate = matchingEvents[0];
          const updates = {};
          if (intentData.entities.startDateTime) updates.startDateTime = intentData.entities.startDateTime;
          if (intentData.entities.endDateTime) updates.endDateTime = intentData.entities.endDateTime;
          if (intentData.entities.location) updates.location = intentData.entities.location;
          if (intentData.entities.description) updates.description = intentData.entities.description;

          const updatedEvent = updateEvent(sessionId, eventToUpdate.id, updates);
          specializedData = updatedEvent;
          assistantMessage = formatEventUpdated(updatedEvent);
        }
        break;

      case 'DELETE_EVENT':
        // Find and delete event
        const deleteTitle = intentData.entities.title;
        const eventsToDelete = findEventsByTitle(sessionId, deleteTitle);

        if (eventsToDelete.length === 0) {
          assistantMessage = `I couldn't find any events matching "${deleteTitle}". Please check the title or event ID.`;
        } else if (eventsToDelete.length > 1) {
          assistantMessage = `I found ${eventsToDelete.length} events matching "${deleteTitle}":\n\n`;
          eventsToDelete.forEach((event, i) => {
            assistantMessage += `${i + 1}. ${event.title} (ID: ${event.id}) - ${new Date(event.startDateTime).toLocaleString()}\n`;
          });
          assistantMessage += `\nPlease specify which event you'd like to delete by providing the event ID.`;
        } else {
          const eventToDelete = eventsToDelete[0];
          deleteEvent(sessionId, eventToDelete.id);
          assistantMessage = formatEventDeleted();
          specializedData = { deletedEventId: eventToDelete.id };
        }
        break;

      default:
        // Default response for other intents with full conversation history
        const responseMessages = [
          { role: 'system', content: 'You are a helpful personal assistant. Give friendly, natural responses to the user. Be concise and helpful. Use markdown formatting for better readability (bold, lists, headers when appropriate). Remember and reference previous conversations when relevant.' },
          ...history.slice(-10), // Include last 10 messages for full context (5 exchanges)
        ];

        const assistantResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: responseMessages,
          temperature: 0.7
        });

        assistantMessage = formatGeneralResponse(assistantResponse.choices[0].message.content);
    }

    history.push({ role: 'assistant', content: assistantMessage });

    // Keep conversation history reasonable (last 20 messages)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    res.json({
      response: assistantMessage,
      intent: intentData,
      specializedData: specializedData
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Clear conversation history
app.post('/api/clear', (req, res) => {
  const { sessionId = 'default' } = req.body;
  conversationHistory.delete(sessionId);
  res.json({ success: true });
});

// Calendar REST API endpoints

// Get all events or events within a date range
app.get('/api/calendar/events', (req, res) => {
  try {
    const { sessionId = 'default', startDate, endDate } = req.query;

    let events;
    if (startDate && endDate) {
      events = findEventsByDateRange(sessionId, startDate, endDate);
    } else {
      events = getCalendarEvents(sessionId);
    }

    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get a specific event by ID
app.get('/api/calendar/events/:eventId', (req, res) => {
  try {
    const { sessionId = 'default' } = req.query;
    const { eventId } = req.params;

    const events = getCalendarEvents(sessionId);
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
});

// Create a new event
app.post('/api/calendar/events', (req, res) => {
  try {
    const { sessionId = 'default', event } = req.body;

    if (!event || !event.title || !event.startDateTime) {
      return res.status(400).json({ error: 'Event title and start date/time are required' });
    }

    // Calculate end time if not provided
    let endDateTime = event.endDateTime;
    if (!endDateTime) {
      const start = new Date(event.startDateTime);
      endDateTime = new Date(start.getTime() + 60 * 60000).toISOString(); // Default 1 hour
    }

    const newEvent = createEvent(sessionId, {
      ...event,
      endDateTime
    });

    res.status(201).json({ event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Update an existing event
app.put('/api/calendar/events/:eventId', (req, res) => {
  try {
    const { sessionId = 'default' } = req.query;
    const { eventId } = req.params;
    const { updates } = req.body;

    if (!updates) {
      return res.status(400).json({ error: 'Updates are required' });
    }

    const updatedEvent = updateEvent(sessionId, eventId, updates);

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// Delete an event
app.delete('/api/calendar/events/:eventId', (req, res) => {
  try {
    const { sessionId = 'default' } = req.query;
    const { eventId } = req.params;

    const deleted = deleteEvent(sessionId, eventId);

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Personal Assistant server running on http://localhost:${PORT}`);
});
