export const environment = {
  lastPublish: null,
  production: false,
  stripePublicKey: '',
  version: 'dev',
  plaid_institution: 'MacroSifter',
  plaid_client_id: '62fe6b548e95650013d54b06',
  plaid_secret: 'aa251c610aa7a64b8203cfe7b2fb7f',
  client_name: 'MacroSifter',
  PLAID_ENV: 'sandbox',
  country_codes: ['US'],
  webhook:
    'https://2e60-2405-204-92ad-cf2c-9cfc-2c1-3573-d858.in.ngrok.io/api/v1/plaid/receive_webhook',
  redirect_uri: 'http://localhost:4200/en/plaid-oauth-redirect'
};
