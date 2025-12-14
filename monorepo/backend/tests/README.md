# Running the Tests

To run the test suite for the Recipe App backend:

## Installation

First, install the test dependencies:

```bash
cd /home/tomas/my-projects/recepies-app/monorepo/backend
pip install -r requirements-dev.txt
```

## Running Tests

### Run all tests
```bash
pytest -v
```

### Run specific test file
```bash
pytest tests/test_auth.py -v
pytest tests/test_users.py -v
pytest tests/test_recipes.py -v
```

### Run with coverage
```bash
pytest --cov=. --cov-report=html --cov-report=term
```

### Run only integration tests
```bash
pytest -m integration
```

## Test Database

Tests use a separate database `recipe_app_test` to avoid affecting your development data. Each test automatically cleans the database before and after execution to ensure isolation.

## Important Notes

1. **MongoDB Required**: Ensure MongoDB is running and accessible at the URL specified in your `.env` file
2. **Environment Variables**: Tests read from the same `.env` file as the application
3. **Test Isolation**: Each test is independent and cleans up after itself
