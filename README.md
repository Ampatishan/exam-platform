# Exam Platform - Test Ingestion Module

This is the implementation of the TestIngestionModule for the Exam Platform project.

## Features Implemented

1. **JSON Validation** - Validates test JSON against the defined schema using Zod
2. **Database Storage** - Stores tests, sections, and questions in PostgreSQL using Prisma
3. **Answer Stripping** - Ensures answers are not exposed to students
4. **API Endpoint** - `/api/tests/upload` for test file uploads

## API Endpoints

### POST /api/tests/upload
Uploads a test as a JSON file

**Request:**
- Content-Type: multipart/form-data
- Form field: `file` (JSON file)

**Success Response (201 Created):**
```json
{
  "testId": "cjld8x2y1000001234567890"
}
```

**Error Responses:**
- 400 Bad Request: No file provided or invalid JSON
- 422 Unprocessable Entity: Validation error
- 500 Internal Server Error: Database error

## Implementation Details

### Data Flow
1. Client uploads JSON test file
2. Server validates JSON against Zod schema
3. Server stores test data in database
4. Server returns test ID

### Security
- Answers are stored server-side only
- Student-facing API responses strip answer fields
- Input validation prevents malformed data

## Testing

Unit tests are located in `src/__tests__/test-ingestion.test.ts`