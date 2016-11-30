'use strict';

export function authInterceptor($rootScope, $q, $cookies, $location, Util) {
  'ngInject';

  return {
    // Add authorization token to headers
    request(config) {
      config.headers = config.headers || {};
      if($cookies.get('token') && Util.isSameOrigin(config.url)) {
        config.headers.Authorization = `Bearer ${$cookies.get('token')}`;
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError(response) {
      if(response.status === 401) {
        $location.path('/login');

        // remove any stale tokens
        $cookies.remove('token');
      }
      return $q.reject(response);
    }
  };
}
