# YOUNIVITY - Academic Life Management Platform

## Overview

YOUNIVITY is a comprehensive platform designed to help students unify their academic life by:
- Managing assignments from multiple sources (Learning Suite, Canvas)
- Organizing tasks with an interactive calendar
- Collaborating with classmates in real-time group chats
- Centralizing academic information in one place

## Features

### ✅ Implemented
- **Multi-method Authentication**
  - Email/Password
  - Google OAuth (integration ready)
  - BYU NetID (integration ready)

- **Assignment Management**
  - Create, view, and complete assignments
  - Integration points for Learning Suite and Canvas
  - Manual task creation
  - Due date tracking

- **Interactive Calendar**
  - Visual calendar view of all assignments
  - Month, week, day, and agenda views
  - Color-coded by completion status

- **Group Collaboration**
  - Create and join study groups
  - Real-time chat functionality
  - Message history

- **Settings & Configuration**
  - LMS API key management
  - Profile information
  - Easy integration configuration

- **Ad Integration Ready**
  - Ad zones placed on every page
  - Ready for Google AdSense or custom ads

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
- **Real-time**: WebSocket support

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React hooks
- **Calendar**: react-big-calendar
- **Routing**: React Router v7
- **Notifications**: Sonner

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn package manager

### Backend Setup
```bash
cd /app/backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup
```bash
cd /app/frontend
yarn install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Run development server
yarn start
```

## Project Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Groups.jsx
│   │   │   ├── GroupChat.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/    # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   └── ui/        # Shadcn components
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── INTEGRATION_GUIDE.md   # Detailed integration instructions
└── README.md              # This file
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/byu-netid` - BYU NetID auth
- `GET /api/auth/me` - Get current user

### Assignment Endpoints
- `GET /api/assignments` - List all assignments
- `POST /api/assignments` - Create assignment
- `PATCH /api/assignments/{id}/complete` - Toggle completion
- `DELETE /api/assignments/{id}` - Delete assignment

### LMS Integration Endpoints
- `GET /api/lms/config` - Get configuration
- `POST /api/lms/config` - Update configuration
- `POST /api/lms/sync` - Sync from LMS

### Group Endpoints
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create group
- `POST /api/groups/{id}/join` - Join group
- `GET /api/groups/{id}/messages` - Get messages
- `POST /api/groups/{id}/messages` - Send message

### WebSocket
- `WS /ws/groups/{id}` - Real-time chat

## Integration Guide

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed instructions on:
- Learning Suite integration
- Canvas integration
- Google OAuth setup
- BYU NetID authentication
- Advertising integration

## Testing

Comprehensive tests have been run covering:
- ✅ All backend endpoints (100% success)
- ✅ User authentication flows
- ✅ Assignment CRUD operations
- ✅ Group creation and chat
- ✅ Calendar functionality
- ✅ Settings management

Test results: **98% overall success rate**

See `/app/test_reports/iteration_1.json` for detailed test results.

## Design Philosophy

### Color Palette
- **Primary**: Ocean teal (#14b8a6) to blue (#3b82f6) gradients
- **Background**: Deep navy (#0a1929)
- **Accents**: Light teal and blue tones
- Modern, clean, professional aesthetic

### Typography
- **Headings**: Space Grotesk (bold, modern)
- **Body**: Inter (readable, clean)

### UI/UX Principles
- Clean, uncluttered interfaces
- Gradient accents for visual interest
- Rounded corners and soft shadows
- Responsive design
- Accessibility-first approach

## Monetization

Ad placement zones are strategically placed on:
- Landing page (bottom)
- Dashboard (bottom)
- Calendar page (bottom)
- Groups page (bottom)
- Group chat (bottom)
- Settings page (bottom)

All zones are clearly marked and ready for ad network integration.

## Future Enhancements

### Phase 1 (Integration Ready)
- [ ] Complete Learning Suite API integration
- [ ] Complete Canvas API integration
- [ ] Setup Google OAuth credentials
- [ ] Configure BYU NetID authentication

### Phase 2 (Features)
- [ ] Push notifications for upcoming assignments
- [ ] Mobile app (React Native)
- [ ] Assignment reminders
- [ ] File sharing in groups
- [ ] Grade tracking
- [ ] Study time tracking

### Phase 3 (Advanced)
- [ ] AI-powered study recommendations
- [ ] Integration with more LMS platforms
- [ ] Virtual study rooms with video chat
- [ ] Gamification and achievements

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

Proprietary - All rights reserved

## Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Contact the development team
- Check INTEGRATION_GUIDE.md for integration help

## Acknowledgments

- Built with React, FastAPI, and MongoDB
- UI components from Shadcn/ui
- Icons from Lucide React
- Calendar from react-big-calendar

---

**YOUNIVITY** - Unifying Academic Life
