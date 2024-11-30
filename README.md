# Appointment Scheduling System

This is a backend system for scheduling notifications that remind patients of their upcoming appointments. It focuses on sending email notifications a few hours before the scheduled time.

## Technologies Used

- Next.js: A React framework for building server-rendered applications.
- TypeScript: A superset of JavaScript that adds optional static typing.
- PostgreSQL: An open-source relational database management system.
- Redis: An open-source, in-memory data structure store used as a database, cache, and message broker. In this project, the Redis server is set up using Docker Desktop and the redis/redis-stack image from Docker Hub.
- BullMQ: A premium message queue system for Node.js, based on Redis.
- Nodemailer: A module for Node.js applications to send emails.

## Features

1. **User Management**:
   - **User Registration**: The system provides API endpoints for doctors and patients to register. The required fields are name, email, password, and role (doctor or patient). The system uses the following validation rules:
     - Name: Must be provided, at least 3 characters long.
     - Email: Must be provided and in a valid email format.
     - Password: Must be provided, at least 6 characters long.
     - Role: Must be either "doctor" or "patient".
   - **User Authentication**: The system uses JWT-based authentication for all API endpoints. Only authenticated users can interact with the system. To access the protected routes, a user must first log in and copy the text in the "token" field, which includes the word "Bearer" (e.g., "token": "Bearer eJher..."). This token should then be pasted in the "Authorization" header of Postman (or any other API testing software) to access the protected routes.

2. **Appointment Scheduling**:
   - **Appointment Booking**: Patients can book an appointment with a doctor by providing the date, time, and doctor ID. The system checks for the following validation rules:
     - Date: Must be provided, in the YYYY-MM-DD format, and must be in the future.
     - Time: Must be provided, in the HH:mm format.
     - Doctor ID: Must be provided and should be a number.
   - **Appointment Confirmation**: When an appointment is successfully booked, the system sends an email confirmation to the patient.
   - **Appointment Reminder**: The system automatically sends an email reminder to the patient a few hours before the scheduled appointment time.

3. **Notification System**:
   - The system uses Redis and BullMQ to handle sending notifications asynchronously, ensuring reliable and scalable email delivery. The Redis server is set up using Docker Desktop and the redis/redis-stack image from Docker Hub.
   - Nodemailer is the email delivery service used for sending appointment confirmation and reminder emails.

4. **Error Handling**:
   - **Invalid Appointment Data**: The system validates the appointment data, including checking for past dates, invalid times, and overlapping appointments for the doctor. If any of these conditions are not met, the system returns a 422 Unprocessable Entity status code with the appropriate error messages.

   - **Example**: If a patient tries to book an appointment for a past date, the system will respond with the following error:

     ```json
     {
       "errors": {
         "datetime": "The appointment time must be in the future."
       }
     }
     ```

   - **Incorrect or Missing Fields**: The system uses the Zod library for request validation. If a client sends a request with incorrect or missing fields, the system returns a 422 Unprocessable Entity status code with detailed validation errors.

   - **Example**: If a client forgets to include the `doctorID` field when booking an appointment, the system will respond with the following error:

     ```json
     {
       "message": "Invalid data",
       "errors": {
         "doctorID": "Doctor ID must be provided and should be a number."
       }
     }
     ```

   - **Failed Notification Delivery**: In case of any errors during email notification delivery, the system logs the errors and retries the job a few times using the BullMQ queue. This ensures that notifications are eventually delivered, even if there are temporary issues with the email service or network.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- Docker Desktop (for running the Redis server)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/appointment-scheduling-system.git
```

2. Install the dependencies:

```bash
cd appointment-scheduling-system
npm install
```

3. Set up the environment variables:

Create a `.env` file in the root directory and add the following variables:

```
PORT=8000
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/your-database-name?schema=public"
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
FROM_EMAIL=your-email@gmail.com
REDIS_HOST=localhost
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
SECRET_KEY=your-secret-key
```

4. Start the Redis server using Docker Desktop:

```bash
docker pull redis/redis-stack
docker run -d --name redis-stack -p 6379:6379 redis/redis-stack
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Start the development server:

```bash
npm run dev
```

The server will start running at `http://localhost:8000`.

## API Documentation

### User Management

**Login**
- Endpoint: `POST /api/auth/login`
- Request Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- Response:
  ```json
  {
    "message": "logged in successfully",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "patient",
      "tokenVersion": 1,
      "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

**Register**
- Endpoint: `POST /api/auth/register`
- Request Body:
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password",
    "role": "patient"
  }
  ```
- Response:
  ```json
  {
    "message": "user created successfully. Check for email verification"
  }
  ```

### Appointment Scheduling

**Create Appointment**
- Endpoint: `POST /api/appointments/createAppointment`
- Request Body:
  ```json
  {
    "doctorID": 1,
    "date": "2023-06-15",
    "time": "14:30"
  }
  ```
- Response:
  ```json
  {
    "message": "Appointment created successfully",
    "data": {
      "id": 1,
      "doctorID": 1,
      "patientID": 2,
      "date": "2023-06-15",
      "time": "14:30"
    }
  }
  ```

To access the protected routes, such as creating an appointment, the user must first log in and include the provided "Bearer" token in the "Authorization" header of their API requests.