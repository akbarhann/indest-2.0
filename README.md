# INDEST - Village Data Dashboard

This project is a dashboard for analyzing village data (Macro and Micro views), capable of generating AI-driven insights.

## Project Structure

- `frontend/`: React application (Vite + TailwindCSS).
- `backend/`: FastAPI backend service.
- `data/`: Data storage (typically CSVs or local DBs).

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    - Windows: `venv\Scripts\activate`
    - Linux/Mac: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r ../requirements.txt 
    # OR if there is a specific backend requirements
    pip install -r requirements.txt
    ```
5.  Set up environment variables:
    - Copy `.env.example` to `.env`.
    - Fill in your `GEMINI_API_KEY`.
6.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Features

- **Macro Dashboard**: Overview of village statistics.
- **Micro Dashboard**: Detailed view of specific village data.
- **AI Insights**: SWOT analysis and narratives generated using Gemini API.
