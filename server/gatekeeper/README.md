# Deplayer Gatekeeper Service

This service acts as a middleware between the Deplayer client and the Electric.sql sync server. It handles user authentication using WebAuthn (passkeys) and proxies authenticated requests to the Electric.sql server. The service has been implemented using Hono, a lightweight, fast web framework for TypeScript.

## Features

- **WebAuthn Authentication**
  - Secure passkey-based registration and authentication
  - JWT token issuance for API access
  - Token validation for protected routes

- **ElectricSQL Integration**
  - Proxies shape queries from ElectricSQL
  - Handles database subscriptions

- **Custom Write-Path Sync**
  - `/v1/changes` endpoint for client changes
  - Processing and validation of client-side changes
  - Support for bidirectional synchronization

- **Security**
  - JWT authentication
  - Rate limiting
  - Request validation
  - Secure HTTP headers
  - Pretty JSON formatting

## Prerequisites

- Node.js 18 or higher
- Supabase account and project
- Electric.sql sync server
- Docker and Docker Compose (optional)

## Setup

1. Copy the environment variables template:

   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:

   - Set your Supabase URL and API key
   - Configure your JWT secret
   - Set your Electric.sql signing key
   - Adjust other variables as needed

3. Create the following table in your Supabase database:
   ```sql
   create table credentials (
     user_id text primary key,
     credential_id text not null,
     public_key text not null,
     counter bigint not null default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

## Running the Service

### Using Docker Compose

The service is part of the Deplayer stack and can be started using:

```bash
docker-compose up
```

### Development Mode

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run in production mode:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- **POST `/register`**: Start WebAuthn registration
  - Request: `{ username: string, displayName: string }`
  - Response: WebAuthn registration options

- **POST `/register/verify`**: Complete WebAuthn registration
  - Request: WebAuthn registration response
  - Response: `{ success: true, token: string }`

- **POST `/auth`**: Start WebAuthn authentication
  - Request: `{ username: string }`
  - Response: WebAuthn authentication options

- **POST `/auth/verify`**: Complete WebAuthn authentication
  - Request: WebAuthn authentication response
  - Response: `{ success: true, token: string }`

### Synchronization

- **GET `/v1/shape`**: ElectricSQL shape endpoint
  - Requires authentication
  - Query params: `table` (table name)
  - Returns shape data for subscription

- **POST `/v1/changes`**: Process client-side changes
  - Requires authentication
  - Request:
    ```json
    {
      "table": "table_name",
      "changes": [
        {
          "id": 1,
          "rowId": "row-123",
          "operation": "INSERT|UPDATE|DELETE",
          "data": { ... }
        }
      ]
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "results": [
        { "id": 1, "success": true }
      ],
      "errors": [
        { 
          "id": 2, 
          "success": false, 
          "message": "Error message" 
        }
      ]
    }
    ```

- **ALL `/v1/electric/*`**: Generic proxy to ElectricSQL endpoints
  - Requires authentication
  - Forwards all requests to the Electric.sql server

## Client Integration

1. Update your Deplayer client settings with the gatekeeper URL
2. Configure the sync settings with your database details
3. Use the WebAuthn endpoints for user registration and authentication

## Technical Implementation

### Framework

The service uses [Hono](https://hono.dev/), a lightweight, fast, and modern web framework for building APIs. Hono offers:

- Extremely fast performance
- TypeScript-first development
- Middleware architecture
- Web standards compatibility
- Excellent developer experience

### Architecture

The codebase follows a modular structure:

- `src/index.ts` - Main entry point
- `src/routes/` - Route handlers
- `src/middleware/` - Middleware functions
- `src/types/` - TypeScript type definitions

### Security Considerations

- Store sensitive environment variables securely
- Use HTTPS in production
- Rate limiting is implemented to prevent abuse
- Secure headers are automatically applied
- JWT tokens are validated for all protected routes
- The service includes comprehensive error handling

## License

This project is part of Deplayer and is licensed under the same terms.
