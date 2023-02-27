export const environment = {
  lastPublish: '{BUILD_TIMESTAMP}',
  production: true,
  stripePublicKey: '',
  version: `v${require('../../../../package.json').version}`,
  plaid_client_id: '62fe6b548e95650013d54b06',
  plaid_secret: 'aa251c610aa7a64b8203cfe7b2fb7f',
  plaid_institution: 'MacroSifter',
  PLAID_ENV: 'sandbox',
  client_name: 'Macrosifter',
  country_codes: ['US'],
  webhook: 'https://macrosifter.com/api/v1/plaid/receive_webhook',
  redirect_uri: 'https://macrosifter.com/plaid-oauth-redirect'

  // plaid_client_id : '610bdbc99ef9440010dd68c6',
  // plaid_secret: '3cff1e787d53bd8e496e26bdc8281e',
  // plaid_institution: 'Mobile First Applications'
};
