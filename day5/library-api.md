# Library Books REST API Design

## Overview

This document describes a REST-style API for managing a library's books. The examples use `/api` as the API base path and JSON for request and response bodies. Book identifiers are represented by `{bookId}`.

A book may have fields such as `id`, `title`, `author`, `isbn`, `publishedYear`, and `available`.

## Endpoints

### 1. List all books

- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Returns a collection of books in the library.
- **Example request body:** None required.
- **Success status:** `200 OK`

### 2. Get one book

- **Method:** `GET`
- **Path:** `/api/books/{bookId}`
- **Description:** Returns the details for the book with the specified identifier.
- **Example request body:** None required.
- **Success status:** `200 OK`

### 3. Create a book

- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Creates a new book record and returns the created resource.
- **Example request body:**

  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "publishedYear": 1958,
    "available": true
  }
  ```

- **Success status:** `201 Created`

### 4. Update a book

- **Method:** `PUT`
- **Path:** `/api/books/{bookId}`
- **Description:** Replaces the editable details of an existing book with the supplied values.
- **Example request body:**

  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "isbn": "9780385474542",
    "publishedYear": 1958,
    "available": false
  }
  ```

- **Success status:** `200 OK` (returns the updated book).

### 5. Delete a book

- **Method:** `DELETE`
- **Path:** `/api/books/{bookId}`
- **Description:** Removes the specified book from the library records.
- **Example request body:** None required.
- **Success status:** `204 No Content`

### 6. List books by author

- **Method:** `GET`
- **Path:** `/api/books?author=Chinua%20Achebe`
- **Description:** Returns books whose author matches the `author` query parameter. The value should be URL-encoded when necessary.
- **Example request body:** None required; the author is supplied in the query string.
- **Success status:** `200 OK`

## Error responses

- **`400 Bad Request`** — The request is invalid, such as when a create request omits a required `title` or sends a non-numeric `publishedYear`.
- **`404 Not Found`** — The requested book does not exist, such as `GET /api/books/9999` when no book has identifier `9999`.

## Notes

- Requests with JSON bodies should send the header `Content-Type: application/json`.
- A successful list request may return an empty array if no books match the query.
- The API should validate input on the server and return clear error messages without exposing sensitive implementation details.
