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

module.exports = {
  baseUrl : 'http://localhost:5000/gatekeeper',
  activationRequired: true,

  email : {
    transport: {
      jsonTransport: true
    },

    views: {
      options: {
        extension: 'ejs'
      }
    },
    message: {
      from : 'no-reply@onehilltech.com',
    },
    locals: {
      twitterHandle: 'onehilltech'
    },
  },

  tokens: {
    // This is the base options for all token generators.
    $: {
      algorithm: 'HS256',
      secret: 'ssshhh',
      issuer: 'firebase-messaging'
    }
  }
};
