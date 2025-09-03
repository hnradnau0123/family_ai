# 🏠 Irori - Family Hearth Application Sitemap

## 📋 **Complete Navigation Structure**

### **🏠 Root Level**
```
/ (Home Page)
├── Redirects to /auth/signin if not authenticated
└── Redirects to /dashboard if authenticated
```

### **🔐 Authentication**
```
/auth/signin
├── Email-based authentication
├── NextAuth.js integration
└── Redirects to /dashboard on success
```

### **📊 Main Dashboard**
```
/dashboard
├── Family overview
├── Quick stats (children, conversations, insights)
├── Recent activity
├── Conversation starters
└── Quick actions
```

### **👨‍👩‍👧‍👦 Children Management**
```
/dashboard/children
├── List all children
├── Child statistics
├── Quick actions
└── Sub-pages:
    ├── /dashboard/children/new
    │   ├── Add new child form
    │   └── Birth date, name input
    └── /dashboard/children/[id]
        ├── Individual child profile
        ├── Conversation history
        ├── Insights summary
        ├── Recommendations
        └── Growth tracking
```

### **💬 Conversations**
```
/dashboard/conversations
├── List all conversations
├── Filter by child, date, processed status
├── Conversation statistics
└── Sub-pages:
    ├── /dashboard/conversations/new
    │   ├── Select child
    │   ├── Choose conversation mode:
    │   │   ├── 📹 Traditional Recording
    │   │   ├── 💡 AI-Guided Suggestions
    │   │   ├── 🤖 Interactive AI Partner
    │   │   └── 🧠 Advanced AI Facilitator (PREMIUM)
    │   └── Recording interface
    └── /dashboard/conversations/[id]
        ├── Conversation details
        ├── Audio playback
        ├── Transcript
        ├── AI-generated insights
        └── Retry analysis option
```

### **🧠 AI Insights**
```
/dashboard/insights
├── Aggregated insights across all children
├── Filter by child, type, confidence
├── Insight categories
└── Sub-pages:
    └── /dashboard/insights/visualize
        ├── MBTI-style personality charts
        ├── Radar charts for development areas
        ├── Timeline visualizations
        └── Interactive data exploration
```

### **🎵 Personalized Recommendations**
```
/dashboard/playlist
├── AI-generated recommendations
├── Content suggestions:
│   ├── 🎵 Music
│   ├── 🎬 Movies & Shows
│   └── 📺 Anime
├── Activity suggestions:
│   ├── 🎨 Hobbies
│   ├── 📚 Lessons
│   └── 🎪 Weekend Events
└── Personalized based on child's interests
```

---

## 🔌 **API Endpoints**

### **Core APIs**
- `POST /api/auth/[...nextauth]` - Authentication handling
- `GET|POST /api/children` - Child management
- `GET /api/children/[id]` - Individual child data
- `GET|POST /api/conversations` - Conversation management
- `GET /api/conversations/[id]` - Individual conversation
- `POST /api/conversations/[id]/reprocess` - Retry AI analysis
- `GET /api/dashboard` - Dashboard data aggregation
- `GET /api/insights` - Insights retrieval
- `GET /api/insights/visualize/[childId]` - Visualization data
- `GET /api/recommendations/[childId]` - Personalized recommendations

### **Advanced AI APIs**
- `POST /api/voice/synthesize` - ElevenLabs voice synthesis
- `POST /api/conversations/real-time-assist` - Real-time parent guidance
- `POST /api/conversations/interactive-ai` - Interactive AI responses
- `POST /api/conversations/family-ai-assist` - Family facilitation

---

## 🎯 **Key Features by Section**

### **🔐 Authentication & Security**
- NextAuth.js session management
- Secure credential-based auth
- User session persistence
- Protected API routes

### **👨‍👩‍👧‍👦 Family Management**
- Multiple child profiles
- Age-appropriate customization
- Family-wide insights
- Child-specific recommendations

### **🎙️ Conversation Recording (4 Modes)**

#### **1. 📹 Traditional Recording**
- Standard audio recording
- Post-conversation AI analysis
- Transcript generation
- Insight extraction

#### **2. 💡 AI-Guided Suggestions**
- Real-time suggestions to parents
- Conversation enhancement tips
- Question prompts during recording
- Engagement optimization

#### **3. 🤖 Interactive AI Partner**
- AI speaks directly to child
- Real-time conversation participation
- Voice recognition & synthesis
- Curiosity-driven dialogue

#### **4. 🧠 Advanced AI Facilitator (PREMIUM)**
- Research-based intervention system
- Parent/child voice detection
- ElevenLabs premium voice quality
- Psychology-grounded guidance
- Academic research integration

### **🧠 AI-Powered Analysis**
- Psychological development insights
- Curiosity pattern recognition
- Interest area identification
- Social skill assessment
- Research-based recommendations

### **📊 Visualization & Analytics**
- Interactive charts and graphs
- Development timeline tracking
- Personality assessments
- Progress monitoring

### **🎵 Personalized Recommendations**
- Content suggestions (music, movies, shows)
- Activity recommendations (hobbies, lessons, events)
- Age-appropriate filtering
- Interest-based personalization

---

## 🛠️ **Technology Stack**

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Blue color palette)
- **UI Components**: Custom components with Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts

### **Backend**
- **Runtime**: Node.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **API**: RESTful endpoints

### **AI & Voice**
- **Language Model**: OpenAI GPT-4
- **Speech-to-Text**: OpenAI Whisper
- **Voice Synthesis**: ElevenLabs API + Web Speech API fallback
- **Voice Recognition**: Web Speech API

### **Development & Deployment**
- **Version Control**: Git + GitHub
- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Deployment**: Railway (recommended)
- **Container**: Docker support

---

## 🎨 **Design Philosophy**

### **Color Scheme**
- **Primary**: Blue (#3b82f6) - Trust, calm, intelligence
- **Secondary**: Sky Blue (#0ea5e9) - Openness, communication
- **Accent**: Slate (#64748b) - Sophistication, balance
- **Background**: Light blue tones - Warmth and comfort

### **User Experience**
- **Family-Centered**: Designed for parent-child interaction
- **Age-Appropriate**: Content adapts to child's developmental stage
- **Research-Grounded**: Based on child psychology principles
- **Privacy-First**: Family data security and protection

### **Accessibility**
- **Voice-First**: Multiple voice interaction modes
- **Visual Clarity**: High contrast, readable typography
- **Responsive Design**: Works on all device sizes
- **Intuitive Navigation**: Clear information hierarchy

---

**🔥 This sitemap represents a comprehensive family engagement platform that transforms everyday conversations into meaningful insights about your child's unique spark and curiosity patterns.**
