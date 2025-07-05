# AI Interviewer Platform - Full Stack Integration

A comprehensive AI-powered interview platform with React frontend and Flask backend integration.

## 🚀 Features

### Frontend (React + TypeScript)
- **Multi-role Authentication**: Candidate, HR, and Admin dashboards
- **Real-time AI Interview**: Voice recognition and synthesis
- **Camera Integration**: Face detection and photo capture
- **Dynamic Question Generation**: AI-powered interview questions
- **Comprehensive Analytics**: Performance tracking and insights
- **Responsive Design**: Modern UI with animations

### Backend (Python Flask)
- **AI Question Generation**: Using Mistral AI for dynamic questions
- **Speech Processing**: Text-to-speech and speech-to-text
- **Answer Evaluation**: AI-powered response scoring
- **Database Integration**: Supabase for data persistence
- **RESTful API**: Complete API for frontend integration

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Supabase account (optional)
- Mistral AI API key (optional)

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run install-backend
# or manually: pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Frontend Configuration
VITE_API_URL=http://localhost:5000

# Backend Configuration (Optional)
MISTRAL_API_KEY=your_mistral_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 3. Start the Application

#### Option 1: Start Both Frontend and Backend Together
```bash
npm start
```

#### Option 2: Start Separately
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📡 API Integration

The frontend automatically connects to the backend for:

### Core Features
- **Question Generation**: AI-powered interview questions
- **Speech Processing**: Voice-to-text and text-to-voice
- **Answer Evaluation**: Real-time response scoring
- **Data Persistence**: User profiles and interview results

### API Endpoints
- `GET /health` - Backend health check
- `POST /save-personal-info` - Save user profile
- `POST /submit-response` - Submit interview response
- `POST /generate_question` - Generate AI questions
- `POST /tts` - Text-to-speech conversion
- `POST /stt` - Speech-to-text conversion
- `POST /job_description` - Save job details
- `POST /evaluate_all_answer` - Final evaluation

## 🔧 Backend Status

The application includes a real-time backend status indicator in the bottom-right corner:

- **Green**: Backend connected and working
- **Red**: Backend disconnected or error
- **Yellow**: Checking connection status

## 🎯 Usage Flow

### For Candidates
1. **Sign Up/Login** as a candidate
2. **Complete Profile** with education and skills
3. **Set Job Description** for the interview
4. **Take AI Interview** with voice interaction
5. **View Results** with detailed feedback

### For HR Teams
1. **Sign Up/Login** as HR with company details
2. **Access HR Dashboard** with company analytics
3. **Manage Questions** in the question bank
4. **View Candidate Results** and performance metrics

### For Administrators
1. **Login as Admin** with admin credentials
2. **Platform Analytics** across all companies
3. **User Management** and system insights
4. **Export Reports** and data analysis

## 🔒 Security Features

- **Role-based Access Control**: Separate dashboards for each user type
- **Data Encryption**: Secure data transmission
- **Privacy Protection**: Local storage with optional cloud backup
- **Face Verification**: Human presence detection during interviews

## 🎨 UI/UX Features

- **Futuristic Design**: Cyberpunk-inspired interface
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Layout**: Works on all device sizes
- **Real-time Feedback**: Live status indicators
- **Accessibility**: Screen reader friendly

## 🧪 Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development
```bash
python run_backend.py    # Start Flask server
python app.py           # Alternative start method
```

### Environment Variables
- Frontend variables must be prefixed with `VITE_`
- Backend variables are loaded from `.env` file
- Fallback functionality when APIs are unavailable

## 📊 Monitoring

- **Backend Status**: Real-time connection monitoring
- **Error Handling**: Graceful fallbacks for API failures
- **Performance Tracking**: Response time monitoring
- **Health Checks**: Automatic backend health verification

## 🚀 Deployment

### Frontend Deployment
The app is configured for Netlify deployment with proper redirects.

### Backend Deployment
Deploy the Flask backend to platforms like:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**Note**: The application works with or without the backend. When the backend is unavailable, it gracefully falls back to local functionality while maintaining the full user experience.