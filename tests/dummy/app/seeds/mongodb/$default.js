/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { Seed } = require ('@onehilltech/blueprint-mongodb');
const dab = require ('@onehilltech/dab');

/**
 * @class
 */
module.exports = Seed.extend ({
  model () {
    return {
      native: [
        { name: 'client1', email: 'contact@client1.com', client_secret: 'client1', scope: ['gatekeeper.account.create'] },
        { name: 'client2', email: 'contact@client2.com', client_secret: 'client2'},
        { name: 'client3', email: 'contact@client3.com', client_secret: 'client3', enabled: false }
      ],

      accounts: dab.times (5, function (i) {
        const username = `account${i}`;
        return { username: username, password: username, email: `${username}@no-reply.com`};
      }),

      client_tokens: dab.map (dab.get ('native'), function (client) {
        return { client: dab.get ('native.0'), account: client._id };
      }),

      user_tokens: dab.map (dab.get ('accounts'), function (account) {
        return {
          client: dab.get ('native.0'),
          account: account._id,
          refresh_token: dab.id ()
        };
      }),

      devices: [
        { device: 'device_123', client: dab.ref ('native.0'), token: '123' },
        { device: 'device_456', client: dab.ref ('native.0'), token: '456' },
        { device: 'device_789', client: dab.ref ('native.0'), token: '789' },
        { device: 'device_abc', client: dab.ref ('native.0')},
        { device: dab.id (), client: dab.ref ('native.0'), user: dab.ref ('accounts.0'), token: 'abc' },
        { device: dab.id (), client: dab.ref ('native.0'), user: dab.ref ('accounts.1'), token: 'def' }
      ]
    };
  }
});
