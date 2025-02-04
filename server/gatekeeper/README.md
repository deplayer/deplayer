# Deplayer Gatekeeper Service

This service acts as a middleware between the Deplayer client and the Electric.sql sync server. It handles user authentication using WebAuthn (passkeys) and proxies authenticated requests to the Electric.sql server.

## Features

- WebAuthn (passkey) authentication
- User registration and authentication
- Secure proxy to Electric.sql sync server
- Supabase integration for credential storage

## Prerequisites

- Node.js 18 or higher
- Supabase account and project
- Electric.sql sync server
- Docker and Docker Compose

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

## API Endpoints

- `POST /register`: Start WebAuthn registration
- `POST /register/verify`: Complete WebAuthn registration
- `POST /auth`: Start WebAuthn authentication
- `POST /auth/verify`: Complete WebAuthn authentication
- `/electric/*`: Proxy to Electric.sql (requires authentication)

## Client Integration

1. Update your Deplayer client settings with the gatekeeper URL
2. Configure the sync settings with your database details
3. Use the WebAuthn endpoints for user registration and authentication

## Security Considerations

- Store sensitive environment variables securely
- Use HTTPS in production
- Regularly update dependencies
- Monitor server logs for suspicious activity
- Consider implementing rate limiting for production use

## License

This project is part of Deplayer and is licensed under the same terms.
