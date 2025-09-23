# Orion ERP Backend API

FastAPI backend for the Orion ERP system.

## Features

- **FastAPI** with automatic API documentation
- **Async/await** support for high performance
- **Pydantic** for data validation
- **PostgreSQL** database support with SQLAlchemy
- **Redis** for caching and session storage
- **JWT** authentication
- **Docker** containerization
- **CORS** configuration for frontend integration

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── api_v1/
│   │       ├── endpoints/          # API endpoints
│   │       │   ├── auth.py         # Authentication routes
│   │       │   ├── users.py        # User management routes
│   │       │   └── dashboard.py    # Dashboard data routes
│   │       └── api.py              # API router configuration
│   ├── core/
│   │   └── config.py               # Application configuration
│   ├── models/                     # Database models (SQLAlchemy)
│   ├── services/                   # Business logic services
│   └── utils/                      # Utility functions
├── main.py                         # FastAPI application entry point
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker container configuration
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 6+

## Setup Instructions

### 1. Environment Setup

Create a virtual environment:
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your database and Redis configurations:
```env
# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=orion_erp
POSTGRES_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-here
```

### 4. Database Setup

Make sure PostgreSQL is running and create the database:
```sql
CREATE DATABASE orion_erp;
```

### 5. Run the Application

Start the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Docker Setup

### Build and Run with Docker

```bash
# Build the image
docker build -t orion-erp-backend .

# Run the container
docker run -d \
  --name orion-erp-api \
  -p 8000:8000 \
  -e POSTGRES_SERVER=your_db_host \
  -e POSTGRES_USER=your_db_user \
  -e POSTGRES_PASSWORD=your_db_password \
  -e REDIS_URL=redis://your_redis_host:6379 \
  orion-erp-backend
```

### Docker Compose (Recommended)

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - POSTGRES_SERVER=db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=orion_erp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=orion_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Then run:
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info

### Users
- `GET /api/v1/users/` - List all users
- `POST /api/v1/users/` - Create new user
- `GET /api/v1/users/{user_id}` - Get user by ID

### Dashboard
- `GET /api/v1/dashboard/` - Get dashboard data

## Development

### Adding New Endpoints

1. Create a new file in `app/api/api_v1/endpoints/`
2. Define your routes using FastAPI decorators
3. Add the router to `app/api/api_v1/api.py`

Example:
```python
# app/api/api_v1/endpoints/products.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_products():
    return {"products": []}
```

```python
# app/api/api_v1/api.py
from app.api.api_v1.endpoints import products

api_router.include_router(products.router, prefix="/products", tags=["products"])
```

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Production Deployment

1. Set up a production PostgreSQL database
2. Configure Redis for production
3. Set strong SECRET_KEY in environment
4. Use a reverse proxy (nginx) in front of the API
5. Set up SSL/TLS certificates
6. Configure proper logging and monitoring

## Health Check

The API includes a health check endpoint at `/health` that can be used for monitoring and load balancer health checks.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PROJECT_NAME | Project name | Orion ERP |
| VERSION | API version | 1.0.0 |
| API_V1_STR | API v1 prefix | /api/v1 |
| BACKEND_CORS_ORIGINS | Allowed CORS origins | [] |
| POSTGRES_SERVER | PostgreSQL host | localhost |
| POSTGRES_USER | PostgreSQL user | postgres |
| POSTGRES_PASSWORD | PostgreSQL password | password |
| POSTGRES_DB | PostgreSQL database | orion_erp |
| POSTGRES_PORT | PostgreSQL port | 5432 |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| SECRET_KEY | JWT secret key | your-secret-key-here |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiration | 30 |