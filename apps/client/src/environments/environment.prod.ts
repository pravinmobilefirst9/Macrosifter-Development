export const environment = {
  lastPublish: null,
  production: false,
  stripePublicKey: '',
  version: 'dev',
  plaid_institution: 'MacroSifter',
  plaid_client_id: '610ba50cc5c2c100116eb9d5',
  plaid_secret: 'ab0499cac310beb056d759af917f3e',
  client_name: 'MacroSifter',
  PLAID_ENV: 'sandbox',
  country_codes: ['US'],
  webhook:
    'https://2e60-2405-204-92ad-cf2c-9cfc-2c1-3573-d858.in.ngrok.io/api/v1/plaid/receive_webhook',
  redirect_uri: 'http://localhost:4200/en/plaid-oauth-redirect'
};
