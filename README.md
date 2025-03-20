# Energy Market Dashboard

A real-time energy market dashboard built with Django and React.

## Project Structure

This is a monorepo containing:

- `backend/` - Django REST API backend
- `frontend/` - React JavaScript frontend

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```
   python manage.py runserver
   ```

The backend API will be available at http://localhost:8000/api/

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend application will be available at http://localhost:3000/

## API Endpoints

- `GET /api/miso-rt-data/` - Get real-time data from MISO's Current Interval API
