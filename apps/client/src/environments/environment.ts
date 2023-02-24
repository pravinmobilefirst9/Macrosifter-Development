// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Frontend Envirnoment Configuration
export const environment = {
  lastPublish: null,
  production: false,
  stripePublicKey: '',
  version: 'dev',

  plaid_client_id : '62fe6b548e95650013d54b06',
  plaid_secret: '0d2fc4b2595c065156dabc2e99bf6a',
  plaid_institution: 'MacroSifter', 
  PLAID_ENV : 'development',
  client_name: "Macrosifter",
  country_codes: ["US"],
  webhook: 'https://macrosifter.com/api/v1/plaid/receive_webhook',
  redirect_uri: 'https://macrosifter.com/plaid-oauth-redirect'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
