interface AuthConfiguration {
  clientID: string,
  domain: string
}

export const myConfig: AuthConfiguration = {
  clientID: process.env.AUTH0_CLIENT_ID || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  domain: process.env.AUTH0_DOMAIN || 'domain.auth0.com'
};
