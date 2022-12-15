// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  lastPublish: null,
  production: false,
  stripePublicKey: '',
  version: 'dev',
  plaid_client_id: '610bdbc99ef9440010dd68c6',
  plaid_secret: '3cff1e787d53bd8e496e26bdc8281e',
  plaid_institution: 'MacroSifter'
  //plaid_client_id : '610bdbc99ef9440010dd68c6',
  //plaid_secret: '3cff1e787d53bd8e496e26bdc8281e',
  //plaid_institution: 'MobileFirst'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
