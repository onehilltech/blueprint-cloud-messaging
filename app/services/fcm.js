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
  Service,
  model,
  service
} = require ('@onehilltech/blueprint');

const assert = require ('assert');
const gcm = require ('node-gcm');
const debug = require ('debug') ('blueprint:firebase');

const {
  get,
  isArray
} = require ('lodash');

const {fromCallback} = require ('bluebird');

const MAX_RECIPIENTS = 1000;

const ERROR_NOT_REGISTERED = 'NotRegistered';

/**
 * @class FCMService
 *
 * The service wrapper for Firebase Cloud Messaging.
 */
module.exports = Service.extend ({
  _sender: null,

  FirebaseDevice: model ('firebase-device'),

  dryRun: true,

  gatekeeper: service (),

  _tokenGenerator: null,

  init () {
    this._super.call (this, ...arguments);

    // Load the configuration, and initialize the service.
    const config = this.app.lookup ('config:firebase');

    assert (!!config.apiKey, 'The firebase configuration must define the apiKey property.');

    this.dryRun = get (config, 'dryRun', this.dryRun);
    this._sender = gcm.Sender (config.apiKey);

    this._tokenGenerator = this.gatekeeper.makeNamedTokenGenerator ('firebase.device');
  },

  /**
   * Generate the token for the device.
   *
   * @param device
   * @return {*}
   */
  generateToken (device) {
    assert (Object.getPrototypeOf (device) === this.FirebaseDevice.prototype, 'The device parameter is not a FirebaseDevice model.');
    return this._tokenGenerator.generateToken ({}, {jwtid: device.id});
  },

  /**
   * Verify the device token.
   *
   * @param token
   * @return {*}
   */
  verifyToken (token) {
    return this._tokenGenerator.verifyToken (token);
  },

  /**
   * Send a message to a recipient. The recipient can be a single user, or
   * a list of users.
   *
   * @param       recipient     Id, or an array of ids.
   * @param       data          Data for message
   */
  send (recipient, data) {
    debug (`sending message to ${recipient}`);

    if (!isArray (recipient))
      recipient = [recipient];

    // First, get all the tokens for the recipients. We have to remember that
    // a recipient can have more than one token since each device owned by the
    // user has its own token/registration.
    const selection = { user: {$in: recipient} };

    return this.FirebaseDevice
      .find (selection)
      .populate ('user', 'enabled')
      .populate ('client', 'enabled').exec ()
      .then (devices => {
        // There is no need to continue if we do not have any users that match
        // the target recipients.
        if (!devices || devices.length === 0)
          return;

        // Create a new Firebase message, and only select the models where the client
        // is enabled, and the user is enabled, if applicable. We want to filter the
        // list before we start.
        let message = new gcm.Message ({ dryRun : this.dryRun, data });

        let enabled = devices.filter (device => {
          return device.client.enabled && (!device.user || device.user.enabled);
        });

        // We now need to break up the enabled group into MAX_RECIPIENTS, and then
        // send the message the message to each group. This ensures that the message
        // is not rejected by the service.
        let pending = [];

        for (let i = 0, len = enabled.length; i < len; i += MAX_RECIPIENTS) {
          const registrationTokens = enabled.slice (i, i + MAX_RECIPIENTS).map (device => device.token);
          const recipient = { registrationTokens };

          pending.push (this._sendMessage (recipient, message));
        }

        return Promise.all (pending);
      });
  },

  /**
   * Publish a message to a topic.
   *
   * @param     topic     Target topic or condition.
   * @param     data      Data for message
   */
  publish (topic, data) {
    debug (`publishing message to ${topic}`);

    let message = new gcm.Message ({ dryRun : this.dryRun, data });
    let recipient = {};

    // If the topic begins with a slash, then set the topic on the recipient
    // options. Otherwise, it is a condition.

    if (topic[0] === '/')
      recipient.topic = topic;
    else
      recipient.condition = topic;

    return this._sendMessage (recipient, message);
  },

  /**
   * Send the message to the recipient. The recipient is either a registered device,
   * or a topic. The send() and publish() method is responsible for setting this up.
   *
   * @param recipient
   * @param message
   * @return {*}
   * @private
   */
  _sendMessage (recipient, message) {
    return fromCallback (callback => {
      // Send the message to the cloud service.
      this._sender.send (message, recipient, callback);
    }).then (res => {
      // Check for failures in the response. If there are no failures, then
      // there is no need to continue.
      if (res.failure === 0)
        return;

      let tasks = [];

      if (recipient.registrationTokens) {
        // There were some failures. We need to check what the failure is, and
        // remove registration information if the id is not registered.

        let badTokens = res.results.reduce ((badTokens, result, index) => {
          if (result.error === ERROR_NOT_REGISTERED)
            badTokens.push (recipient.registrationTokens[index]);

          return badTokens;
        }, []);

        if (badTokens.length > 0) {
          tasks.push (this.FirebaseDevice.remove ({token: {$in: badTokens}}).exec ());
        }
      }

      return Promise.all (tasks);
    });
  }
});
