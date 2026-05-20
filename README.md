# AI Forge - Production-Ready AI SaaS Platform

AI Forge is a comprehensive platform for creating, training, and deploying AI models. Built with a modern tech stack, it provides a premium experience for AI engineers and businesses.

## 🚀 Key Features

- **Modern Dark UI**: Premium SaaS design using Next.js 14, Tailwind CSS, and Framer Motion.
- **Full Auth System**: Secure JWT-based authentication for users and teams.
- **Dataset Management**: Drag-and-drop uploads for CSV, JSON, and TXT with automatic analysis.
- **Training Pipeline**: Scalable background training jobs powered by Celery and Redis.
- **Model Playground**: Interactive chat interface to test and validate trained models.
- **Real-time Monitoring**: Live progress tracking, logs console, and performance metrics.
- **Dockerized Infrastructure**: One-click setup for PostgreSQL, Redis, and workers.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Framer Motion, Lucide React, Recharts.
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic, Celery.
- **Database**: PostgreSQL (Relational Data), Redis (Broker & Cache).
- **Infrastrucutre**: Docker & Docker Compose.

## 📂 Project Structure

```text
ai-saas-platform/
├── backend/            # FastAPI application
│   ├── api/            # API endpoints (Auth, Datasets, Training, Models)
│   ├── auth/           # JWT utilities
│   ├── models.py       # SQLAlchemy models
│   ├── schemas.py      # Pydantic validation
│   ├── worker.py       # Celery task definitions
│   └── main.py         # App entry point
├── frontend/           # Next.js application
│   ├── src/app/        # App Router pages (Dashboard, Auth, Playground)
│   ├── src/components/ # Reusable UI & Layout components
│   └── src/lib/        # API and utility functions
├── samples/            # Example datasets for testing
├── data/               # Persistent storage for DB, Redis, and Uploads
└── docker-compose.yml  # Full stack orchestration
```

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ (for local backend development)

### 1. Clone & Setup
```bash
# Set environment variables in docker-compose.yml or a .env file
# The default setup works out of the box for development.
```

### 2. Launch with Docker
```bash
docker-compose up --build
```

### 3. Access the Platform
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🧪 Training a Model (MVP Flow)
1. **Register** a new account and login.
2. Go to **Datasets** and upload the sample `samples/sentiment_data.csv`.
3. Create a new **Model** (e.g., Sentiment Classifier).
4. Go to **Training** and start a new job using your dataset and model.
5. Watch the **Real-time Logs** and progress bar.
6. Once completed, go to the **Playground** to test your model!

## 🛡️ Security
- All endpoints (except Auth) require a valid JWT bearer token.
- Passwords are encrypted using Argon2/Bcrypt.
- File uploads are validated for size and type.

## 📄 License
This project is for demonstration purposes. Built by Antigravity.
