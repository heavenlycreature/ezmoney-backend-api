
# EZMoney Backend API Documentation

This documentation provides detailed information about the API endpoints, their methods, request/response formats, and functionality.

---

## **Features**

### **1. User Registration**
- **Method:** `POST`  
- **Endpoint:** `/register`

#### **Request Body**
```json
{
  "email": "string",
  "username": "string",
  "password": "unique"
}
```

#### **Response**
```json
{
  "message": "User created successfully!",
  "token": "string",
  "userId": "uuid"
}
```

---

### **2. User Login**
- **Method:** `POST`  
- **Endpoint:** `/login`

#### **Request Body**
```json
{
  "email": "string",
  "password": "string"
}
```

#### **Response**
```json
{
  "message": "Login successful",
  "token": "string",
  "userId": "uuid"
}
```

---

### **3. User Logout**
- **Method:** `POST`  
- **Endpoint:** `/logout`

#### **Response**
```json
{
  "message": "Kamu berhasil logout"
}
```

---

### **4. Send Financial Data**
- **Method:** `POST`  
- **Endpoint:** `/:userId/transactions`

#### **Request Body**
```json
{
  "income": "number",
  "expenses": "number",
  "catIncome": "string",
  "catExpenses": "string"
}
```

#### **Response**
```json
{
  "success": true,
  "message": "Transaction saved successfully",
  "data": {
    "transactionId": "string",
    "currentBalance": "number",
    "income": "number",
    "expenses": "number",
    "catIncome": "string",
    "catExpenses": "string"
  }
}
```

---

### **5. List Transactions by Month**
- **Method:** `GET`  
- **Endpoint:** `/:useId/transactions/:month?limit=[YYYY-MM format month]&lastDoc=[documentId]`

#### **Response**
```json
{
  "success": true,
  "data": {
    "summary": {
      "month": "string",
      "totalIncome": "number",
      "totalExpenses": "number",
      "balance": "number",
      "lastUpdated": "datetime"
    },
    "transactions": [
      {
        "transactionId": "string",
        "amount": "number",
        "category": "string",
        "date": "datetime"
      }
    ],
    "lastDoc": "string"
  }
}
```

---

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

---

## **License**
This project is licensed under the MIT License.

---
