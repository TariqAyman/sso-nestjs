# OAUTH_SETUP_GUIDE.md

This guide explains how to set up OAuth providers in the Open SSO project.

## Supported Providers

- Google
- Facebook
- Twitter
- GitHub
- Microsoft

## Steps to Configure OAuth

1. **Register your application** with each provider to obtain client ID and secret.
2. **Update environment variables** in `.env` files:
   - Example:
     ```
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret
     FACEBOOK_CLIENT_ID=your-client-id
     FACEBOOK_CLIENT_SECRET=your-client-secret
     ...
     ```
3. **Configure strategies** in NestJS:
   - Strategies are implemented in `src/auth/strategies/` (e.g., `google.strategy.ts`).
   - Each strategy uses the corresponding client ID/secret from environment variables.
4. **Set up routes**:
   - OAuth endpoints are defined in `src/oauth/oauth.controller.ts` and `src/sso/oauth.controller.ts`.
   - Frontend (Next.js) should call these endpoints for authentication.
5. **Test the integration**:
   - Use the frontend login page or API tools (e.g., Postman) to verify OAuth flows.

## Troubleshooting

- Ensure redirect URIs match those configured in provider dashboards.
- Check environment variables for typos or missing values.
- Review logs for errors during authentication.

## References

- [NestJS Passport OAuth](https://docs.nestjs.com/security/authentication)
- [NextAuth.js (if used)](https://next-auth.js.org/)

---
