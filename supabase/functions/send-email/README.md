# PMY Email Edge Function

This Supabase Edge Function handles sending transactional emails for the PMY (Press Means Yes) application.

## Supported Email Types

1. **Contract Invitation** (`contract_invite`)
   - Sent when a user invites someone to collaborate on a contract
   - Includes sender name, invite link, and call-to-action

2. **Amendment Notification** (`amendment_notification`)
   - Sent when a user requests an amendment to an existing contract
   - Includes amendment type and description

3. **Password Reset** (`password_reset`)
   - Sent when a user requests a password reset
   - Includes secure reset link

## Setup

### 1. Configure Environment Variables

Set these secrets in your Supabase project:

```bash
# For Resend (recommended)
supabase secrets set RESEND_API_KEY=your_resend_api_key

# For SendGrid (alternative)
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key

# Optional: specify email provider (defaults to "resend")
supabase secrets set EMAIL_PROVIDER=resend  # or "sendgrid"
```

### 2. Deploy the Function

```bash
# From the project root
supabase functions deploy send-email
```

### 3. Update CORS (if needed)

The function allows all origins by default. For production, update the CORS headers in `index.ts`:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-app-domain.com",
  // ...
};
```

## Usage

### From the React Native App

```typescript
import { sendContractInviteEmail, sendAmendmentNotificationEmail } from '@/services/api';

// Send contract invitation
await sendContractInviteEmail(
  'partner@example.com',
  'John Doe',
  'contract-123',
  'https://pmy.app/invite/abc123',
  'Jane'  // optional recipient name
);

// Send amendment notification
await sendAmendmentNotificationEmail(
  'partner@example.com',
  'John Doe',
  'contract-123',
  'Add Acts',
  'Adding kissing to the consent agreement',
  'Jane'
);
```

### Direct API Call

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    type: 'contract_invite',
    recipientEmail: 'partner@example.com',
    senderName: 'John Doe',
    contractId: 'contract-123',
    inviteUrl: 'https://pmy.app/invite/abc123',
  },
});
```

### Custom Email

You can also send custom emails without using templates:

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Custom Subject',
    html: '<h1>Hello!</h1><p>Custom HTML content</p>',
    text: 'Plain text version',
  },
});
```

## Email Provider Configuration

### Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain for better deliverability
4. Set the `RESEND_API_KEY` secret

### SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with Mail Send permissions
3. Verify your sender identity
4. Set the `SENDGRID_API_KEY` secret
5. Set `EMAIL_PROVIDER=sendgrid`

## Testing Locally

```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve send-email --env-file ./supabase/.env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "contract_invite",
    "recipientEmail": "test@example.com",
    "senderName": "Test User",
    "contractId": "test-123",
    "inviteUrl": "https://pmy.app/invite/test"
  }'
```

## Troubleshooting

### Emails not sending

1. Check that API keys are correctly set
2. Verify your sender domain is configured
3. Check Supabase function logs: `supabase functions logs send-email`

### CORS errors

Update the `corsHeaders` in `index.ts` to include your app's domain.

### Rate limiting

Both Resend and SendGrid have rate limits. Check their documentation for details.
