import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { policies, userSeesNewVersionAfterDeploy } from '../sw-update-fsm.mjs';

describe('PWA update state model (ec6d329)', () => {
  it('stays stale under pre-fix cache-first policy (replays real bug)', () => {
    assert.equal(userSeesNewVersionAfterDeploy(policies.preEc6d329), false);
  });

  it('reaches new version under network-first + eager update', () => {
    assert.equal(userSeesNewVersionAfterDeploy(policies.current), true);
  });
});