# Student Management System

This is a simple student management system with a frontend and a backend.

## Frontend

The frontend is located in the `frontend-student-management` directory. It is built with HTML, CSS, and JavaScript. Bootstrap is used for styling.

### Pages

*   `index.html`: Login page.
*   `register.html`: Registration page.
*   `students.html`: Student management page.
*   `profile.html`: User profile page.

## Backend

The backend is located in the `student-management` directory. It is a Node.js application using Express.js and MongoDB.

### API Endpoints

All API endpoints are prefixed with `/api`.

#### User Routes (`/users`)

*   `POST /register`: Register a new user.
*   `POST /login`: Login a user.
*   `GET /profile`: Get the user's profile information.
*   `PUT /profile`: Update the user's profile information.
*   `PUT /password`: Update the user's password.
*   `POST /logout`: Logout a user.

#### Student Routes (`/students`)

*   `GET /`: Get all students.
*   `GET /:id`: Get a single student.
*   `POST /`: Add a new student.
*   `PUT /:id`: Update a student.
*   `DELETE /:id`: Delete a student.

## How to Run

1.  **Backend:**
    *   Navigate to the `student-management` directory.
    *   Install dependencies: `npm install`
    *   Create a `.env` file with the following variables:
        *   `MONGO_URI`: Your MongoDB connection string.
        *   `JWT_SECRET`: Your JWT secret.
    *   Start the server: `npm run dev`

2.  **Frontend:**
    *   Open the `frontend-student-management` directory.
    *   Open the `index.html` file in your browser.
