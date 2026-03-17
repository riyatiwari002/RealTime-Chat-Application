# Real-Time Messaging Application

A full-stack real-time chat application built with Node.js, Express, Socket.io, MongoDB, and React with Tailwind CSS. Features instant messaging, image sharing, typing indicators, online/offline status, and message deletion.

![Real-Time Chat](https://img.shields.io/badge/Real--Time-Socket.io-0ea5e9?style=flat-square)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-61DAFB?style=flat-square)

## Features

- **Real-time messaging** with Socket.io
- **User authentication** (JWT-based register/login)
- **Text and image messages** with preview before sending
- **Online/offline status** and last seen timestamps
- **Typing indicators** ("User is typing...")
- **Message deletion** (own messages only)
- **Unread message counts** per chat
- **Emoji picker** for fun conversations
- **Responsive design** - WhatsApp/Discord-like UI
- **Image upload** - Cloudinary or local storage (dev fallback)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Real-time | Socket.io |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken) |
| Image Upload | Multer + Cloudinary (local fallback for dev) |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| State | React Context + Hooks |

## Project Structure

```
RealTime-Chat-Application/
├── backend/
│   ├── config/         # DB, Cloudinary config
│   ├── controllers/    # Auth, Message, User controllers
│   ├── middleware/     # JWT auth, Multer upload
│   ├── models/         # User, Message schemas
│   ├── routes/         # API routes
│   ├── socket/         # Socket.io event handlers
│   ├── utils/          # Cloudinary upload helper
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios API client
│   │   ├── components/ # Chat UI components
│   │   ├── context/    # Auth, Socket contexts
│   │   └── pages/      # Login, Register, Chat
│   └── ...
└── README.md
```

## Prerequisites

- **Node.js** 18+ 
- **MongoDB** (local or Atlas)
- **Cloudinary account** (optional - for production image uploads)

## Setup Instructions

### 1. Clone and Install

```bash
cd RealTime-Chat-Application

# Backend
cd backend
npm install

# Frontend (from project root)
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** - Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:5173

# Optional - for Cloudinary image uploads (uses local storage if not set)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend** - Create `frontend/.env` (optional):

```env
VITE_API_URL=   # Leave empty for dev (uses Vite proxy)
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Demo Credentials

After registering, you can create test accounts:

| Username | Email | Password |
|----------|-------|----------|
| demo1 | demo1@test.com | demo123 |
| demo2 | demo2@test.com | demo123 |

Register two users in different browser tabs/windows to test real-time chat.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/users | Get all users (auth) |
| GET | /api/messages/:userId | Get chat history (auth) |
| POST | /api/messages/image | Upload image message (auth) |
| DELETE | /api/messages/:id | Delete own message (auth) |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| connection | - | User connects (JWT auth) |
| disconnect | - | User disconnects |
| join | Client → Server | Join chat with user |
| message | Bidirectional | Send/receive text |
| image | Bidirectional | Send/receive images |
| typing | Client → Server | User typing |
| stopTyping | Client → Server | User stopped |
| deleteMessage | Client → Server | Delete own message |
| messageRead | Client → Server | Mark as read |
| userStatus | Server → Client | Online/offline updates |

## Screenshots

- **Login/Register** - Clean auth forms with validation
- **Chat Interface** - User sidebar + message window + input with emoji
- **Real-time** - Instant delivery, typing indicators, status updates

## License

MIT
