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

const {
  Listener,
  model
} = require ('@onehilltech/blueprint');

const debug = require ('debug') ('blueprint:firebase:remove-tokens-for-account');

/**
 * @class RemoveTokensForAccount
 *
 * A listener that removes all device tokens for an account when the correspond
 * account is deleted from the database.
 */
module.exports = Listener.extend ({
  FirebaseDevice: model ('firebase-device'),

  handleEvent (account) {
    debug (`remove all devices tokens for account ${account.id}`);
    return this.FirebaseDevice.remove ({user: account._id}).exec ();
  }
});
