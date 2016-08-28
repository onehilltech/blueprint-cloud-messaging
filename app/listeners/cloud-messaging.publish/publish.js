var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Sender    = require ('../../../lib/Sender')
  , Constants = require ('../../../lib/Constants')
  ;

var sender;

messaging.once ('app.init', function (app) {
  var config = app.configs['cloud-messaging'];
  sender = new Sender (config);
});

function publish (topic, message, relayTopic) {
  relayTopic = relayTopic || Constants.DEFAULT_RELAY_CALLBACK;
  sender.publish (topic, message, messaging.relay (relayTopic));
}

module.exports = exports = publish;
