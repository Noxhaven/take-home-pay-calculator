/** @typedef {'cache-first' | 'network-first'} NavigationPolicy */
/** @typedef {{ navigation: NavigationPolicy, eagerUpdate: boolean, reloadOnActivate: boolean }} UpdatePolicy */

export function userSeesNewVersionAfterDeploy(policy) {
  let cachedHtml = 1;
  let networkHtml = 1;
  let waitingWorker = null;
  let reloadOnCtrl = false;
  let userSees = 1;

  const serveNavigation = () => (policy.navigation === 'cache-first' ? cachedHtml : networkHtml);

  const onForeground = () => {
    if (policy.eagerUpdate && waitingWorker) {
      waitingWorker = null;
      if (policy.reloadOnActivate) reloadOnCtrl = true;
    }
  };

  const onControllerChange = () => {
    if (reloadOnCtrl) {
      reloadOnCtrl = false;
      userSees = serveNavigation();
    }
  };

  userSees = serveNavigation();
  networkHtml = 2;
  waitingWorker = 2;
  if (policy.navigation === 'network-first') cachedHtml = 2;
  onForeground();
  onControllerChange();
  return userSees >= 2;
}

export const policies = {
  preEc6d329: { navigation: 'cache-first', eagerUpdate: false, reloadOnActivate: false },
  current: { navigation: 'network-first', eagerUpdate: true, reloadOnActivate: true },
};
