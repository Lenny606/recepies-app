# Recipe App

A full-stack application for managing recipes, shopping carts, and AI-powered recipe assistance.

## Project Structure

This is a monorepo containing both the backend and frontend code.

- `monorepo/backend`: FastAPI (Python) backend service.
- `monorepo/frontend`: React (TypeScript/Vite) frontend application.
- `diagnose_db.py`, `diagnose_db_v2.py`: Database diagnostic tools at the root.

## Tech Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Motor](https://motor.readthedocs.io/) (async driver)
- **Authentication:** JWT (jose, passlib)
- **AI Integration:** OpenAI SDK (using Gemini models)
- **Scraping/Processing:** `yt-dlp`, `opencv-python-headless`, `beautifulsoup4`
- **Testing:** `pytest`

### Frontend
- **Framework:** [React](https://react.dev/) 19 (TypeScript)
- **Build Tool:** [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router](https://reactrouter.com/) 7

---

## Getting Started

### Prerequisites

- [Python](https://www.python.org/) 3.10+
- [Node.js](https://nodejs.org/) 18+ and `npm`
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd monorepo/backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    ```
4.  Configure environment variables (see [Environment Variables](#environment-variables)).
5.  Run the application:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd monorepo/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`monorepo/backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `MONGO_DB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | MongoDB database name | `recipe_app` |
| `SECRET_KEY` | Secret key for JWT signing | `temporary_secret_key_for_vibe_coding` |
| `GEMINI_API_KEY` | API Key for Gemini | `""` |
| `GEMINI_MODEL_NAME` | Gemini model to use | `gemini-3-flash-preview` |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173,...` |

### Frontend (`monorepo/frontend/.env`)

| Variable | Description |
| :--- | :--- |
| `VITE_ENV` | Environment name (`development` or `production`) |

---

## Scripts & Tools

### Database Diagnostics (Root)
- `python diagnose_db.py`: Basic MongoDB connection and collection check.
- `python diagnose_db_v2.py`: Extended database health check.

### Seeding (Backend)
Seed the database with initial recipe data:
```bash
cd monorepo/backend
python scripts/seed_recipes.py --author user@example.com --file data/recipes_seed.json
```

### Verification Scripts (Backend)
Various scripts to verify specific features:
- `python verify_consultation.py`
- `python verify_favorite.py`
- `python verify_random.py`
- `python verify_shopping_cart.py`

---

## Testing

### Backend
Run tests using `pytest` from the backend directory:
```bash
cd monorepo/backend
pytest
```

### Frontend
Linting with ESLint:
```bash
cd monorepo/frontend
npm run lint
```

---

## License

TODO: Add license information.
