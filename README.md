
# EZMoney Backend API Documentation

## Mission
EZ Money is a user-friendly financial management application designed to demystify personal finance for everyone, regardless of their economic background. Our mission is to empower individuals to take control of their financial journey with simplicity, clarity, and intuitive tools.

## Who Is EZ Money For?
- Beginners intimidated by complex financial software
- Young professionals starting their financial independence
- Individuals seeking to understand and improve their spending habits
- Anyone wanting to transform their relationship with money without needing an economics degree

## Key Features
- Effortless transaction tracking
- Intelligent saving recommendations
- Clean, intuitive user interface
- Real-time financial insights
- Personalized financial health monitoring

## Our Philosophy
We believe financial wellness should be accessible to everyone. EZ Money breaks down financial management into simple, actionable steps, transforming complicated economic concepts into easy-to-understand insights.

## Core Value
"Financial freedom isn't about how much you earn, but how smartly you manage what you have."

## Vision
To create a world where financial literacy is simple, engaging, and within everyone's reach.

## Base URL
```
https://your-api-domain.com/api
```

## Authentication Endpoints

### 1. User Registration
- **Endpoint:** `/register`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "userId": "string"
  }
  ```
- **Error Responses:**
  - 400: Validation error
  - 409: User already exists

### 2. User Login
- **Endpoint:** `/login`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "token": "jwt_token",
    "userId": "string"
  }
  ```
- **Error Responses:**
  - 400: Invalid credentials
  - 401: Authentication failed

### 3. User Logout
- **Endpoint:** `/logout`
- **Method:** `POST`
- **Authorization:** Required
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "Logged out successfully"
  }
  ```

## Transaction Endpoints

### 4. Save Transaction
- **Endpoint:** `/transactions/:userId`
- **Method:** `POST`
- **Authorization:** Required
- **Request Body:**
  ```json
  {
    "type": "income|expenses",
    "category": "string",
    "subCategory": "string (optional)",
    "amount": "number",
    "note": "string (optional)",
    "saving": "number (0-100)"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "Transaction saved successfully",
    "data": {
      "transactionId": "string",
      "type": "string",
      "category": "string",
      "amount": "number",
      "currentBalance": "number",
      "recommendedSavings": "number"
    }
  }
  ```
- **Error Responses:**
  - 400: Missing required fields
  - 403: Unauthorized access
  - 404: User not found
  - 500: Server error

### 5. Get Monthly Transactions
- **Endpoint:** `/transactions/:userId/:month?limit=[number]&transactionId=[uuid]`
- **Method:** `GET`
- **Authorization:** Required
- **Query Parameters:**
  - `limit` (optional, default: 10): Number of transactions to retrieve
  - `startAfter` (optional): Transaction ID to start pagination
  - `transactionId` (optional): Fetch a specific transaction
- **URL Parameters:**
  - `month`: Month in YYYY-MM format (e.g., 2024-11)
- **Success Response:**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "month": "string",
        "totalIncome": "number",
        "totalExpenses": "number",
        "balance": "number",
        "saving": "number",
        "recommendedSavings": "number",
        "lastUpdated": "ISO date string"
      },
      "transactions": [
        {
          "id": "string",
          "type": "string",
          "category": "string",
          "amount": "number",
          "date": "ISO date string"
        }
      ],
      "lastDoc": "string" // Last transaction ID for pagination
    }
  }
  ```
- **Error Responses:**
  - 400: Invalid month format
  - 401: Authentication error
  - 404: No transactions found
  - 500: Server error

### 5. Get All List Transactions By Type
- **Endpoint:** `/transactions/:userId/:month?type=[income || expenses]`
- **Method:** `GET`
- **Authorization:** Required
- **Query Parameters:**
  - `type` (required): List of transactions type transaction
- **URL Parameters:**
  - `month`: Month in YYYY-MM format (e.g., 2024-11)
- **Success Response:**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "month": "string",
        "totalIncome": "number",
        "totalExpenses": "number",
        "balance": "number",
        "saving": "number",
        "recommendedSavings": "number",
        "lastUpdated": "ISO date string"
      },
      "transactions": [
        {
          "id": "string",
          "type": "string",
          "category": "string",
          "subCategory": "string",
          "amount": "number",
          "note": "string",
          "saving": "string",
          "date": "ISO date string"
        }
      ],
      "totalTransactions": "number" // List of transaction by query 
    }
  }
  ```
- **Error Responses:**
  - 400: Invalid month format
  - 401: Authentication error
  - 404: No transactions found
  - 500: Server error

### 6. Update Saving Recommendation
- **Endpoint:** `/transactions/:userId/update-saving`
- **Method:** `PUT`
- **Authorization:** Required
- **Request Body:**
  ```json
  {
    "saving": "number (1-100)"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "Saving recommendation updated successfully",
    "data": {
      "saving": "number",
      "recommendedSavings": "number"
    }
  }
  ```
- **Error Responses:**
  - 400: Invalid saving percentage
  - 403: Unauthorized access
  - 404: Monthly summary not found
  - 500: Server error

### 7. Delete Transaction
- **Endpoint:** `/transactions/:transactionId/:month`
- **Method:** `DELETE`
- **Authorization:** Required
- **Success Response:**
  ```json
  {
    "status": "success",
    "message": "Transaction deleted successfully",
    "data": {
      "deletedTransactionId": "string",
      "updatedSummary": {
        "totalIncome": "number",
        "totalExpenses": "number",
        "balance": "number"
      }
    }
  }
  ```
- **Error Responses:**
  - 404: Transaction or user not found
  - 403: Unauthorized access
  - 500: Server error

## Authentication Flow
1. Register a new user
2. Login to receive JWT token
3. Include token in `Authorization` header for authenticated requests
4. Logout when session is complete

## Error Handling
- All error responses include a `status` or `success` flag
- Detailed error messages provided in the `message` field
- HTTP status codes indicate the type of error


## **Setup Instructions**

### Prerequisites
- Node.js >= 20.x
- Docker (optional for containerized deployment)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```plaintext
   APP_PORT=3000
   JWT_SECRET=<your-secret-key>
   ```

4. Start the server:
   - Development:
     ```bash
     npm run start-dev
     ```
   - Production:
     ```bash
     npm start
     ```

---

## **API Usage**
- Use tools like [Postman](https://www.postman.com/) or `curl` to interact with the endpoints.
- Example for registration:
  ```bash
  curl --request POST \
       --url http://localhost:3000/register \
       --header 'Content-Type: application/json' \
       --data '{
         "email": "example@example.com",
         "username": "exampleUser",
         "password": "securepassword"
       }'
  ```

---

## **Contributing**
Feel free to contribute by submitting issues or pull requests. Ensure proper formatting and documentation for all code submissions.
