# Personal Assistant Chat App

A simple web-based personal assistant application that uses OpenAI to recognize user intent and provide helpful responses.

## Features

- 🤖 **Intent Recognition**: Automatically detects what the user wants to do
- 💬 **Natural Conversation**: Friendly chat interface
- 📋 **Task Management**: Create and update tasks
- 📅 **Event Scheduling**: Schedule calendar events
- 🍳 **Recipe Help**: Get cooking assistance
- 🔍 **General Queries**: Answer questions

## Intent Types

The assistant can recognize these intents:
- **CREATE_TASK**: Creating new tasks or to-do items
- **UPDATE_TASK**: Modifying existing tasks
- **SCHEDULE_EVENT**: Scheduling calendar events
- **GET_RECIPE**: Cooking help and recipes
- **GENERAL_QUERY**: General questions and conversation

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd personal-assistant-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-your-actual-api-key-here
     PORT=3000
     ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## Usage

Simply type messages in the chat interface. Try these examples:

- "Remind me to buy groceries tomorrow at 5pm"
- "Create a high priority task to finish the report"
- "How do I make chocolate chip cookies?"
- "Schedule a meeting with John next Monday at 2pm"
- "What's the weather like today?"

The app will:
1. Analyze your intent
2. Extract relevant entities (dates, tasks, priorities, etc.)
3. Provide a helpful response
4. Display the intent analysis at the bottom

## Project Structure

```
personal-assistant-chat/
├── server.js           # Express backend with OpenAI integration
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── .env.example       # Example environment file
├── .gitignore         # Git ignore file
└── public/            # Frontend files
    ├── index.html     # Main HTML
    ├── styles.css     # Styling
    └── app.js         # Frontend JavaScript
```

## API Endpoints

### POST /api/chat
Send a message to the assistant.

**Request**:
```json
{
  "message": "Remind me to buy milk",
  "sessionId": "optional-session-id"
}
```

**Response**:
```json
{
  "response": "I'll help you remember to buy milk...",
  "intent": {
    "type": "CREATE_TASK",
    "confidence": 0.95,
    "entities": { ... }
  }
}
```

### POST /api/clear
Clear conversation history for a session.

## Technologies Used

- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4o-mini
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Styling**: Custom CSS with gradient design

## Notes

- The app uses `gpt-4o-mini` for cost-effective intent recognition
- Conversation history is stored in memory (resets on server restart)
- Intent analysis is displayed at the bottom for debugging/transparency

## License

MIT
