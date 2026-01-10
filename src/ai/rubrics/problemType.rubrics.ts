export function getProblemTypeRubric(problemType: string): string {
  switch (problemType) {
    case "AUTH_SECURITY":
      return `
Focus on:
- Password hashing (bcrypt/argon2)
- Token-based authentication (JWT/session)
- Secure comparison
- Proper try/catch
- Edge case handling
- No plaintext secrets
`;

    case "API_BACKEND":
      return `
Focus on:
- Controller-service separation
- Input validation
- Proper HTTP status codes
- Error handling
- Clean business logic
`;

    case "BOT_AUTOMATION":
      return `
Focus on:
- Async handling
- Retries and backoff
- Webhooks vs polling
- Idempotency
- Failure recovery
`;

    case "APP_BACKEND":
      return `
Focus on:
- Database schema correctness
- Relations and constraints
- CRUD correctness
- Transactions
- Data consistency
`;

    case "SYSTEM_DESIGN":
      return `
Focus on:
- Scalability
- Event-driven design
- Idempotency
- Queue usage
- Fault tolerance
`;

    default:
      return `
General backend best practices:
- Clean code
- Error handling
- Security
`;
  }
}
