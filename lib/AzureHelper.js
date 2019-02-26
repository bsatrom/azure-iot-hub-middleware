var when = require('when');

var Message = require('azure-iot-device').Message;
var Client = require('azure-iot-device-http');

var settings = require('../settings.js');
var extend = require('xtend');

var AzureHelper = {

	/**
	 * NOTE!  This is a proof of concept, don't use this in production, it has all kinds of scability and security
	 * problems we're ignoring for the sake of a proof of concept.
	 */

	//TODO: some kind of auth / signature of requests to validate requests from devices
	//TODO: some kind of auto-provisioning, or storage of device creds in a database
		//-> this includes some mapping from particle device id to azure device id



	getClientForDevice: function(deviceID) {

		var connString = settings.azure_device_connString
		return Client.clientFromConnectionString(connString);
	},

	getMessage: function(deviceID, published_at, event_topic, event_contents) {
		var jsonData;
		try{
			jsonData = JSON.parse(event_contents);
		}
		catch(ex){}

		//if (!jsonData) {}
		var msg = new Message();
		msg.properties.add("deviceID", deviceID);
		msg.properties.add("published_at", published_at);
		msg.properties.add("topic", event_topic);
		msg.properties.add("contents", event_contents);

//		var messageData = {
//			deviceID: deviceID,
//			published_at: published_at,
//			event_topic: event_topic,
//			event_contents: event_contents
//		};

		if (jsonData) {
			var keys = Object.keys(jsonData);
			for(var i=0;i<keys.length;i++) {
				var key = keys[i];
				var value = jsonData[key];

				msg.properties.add(key, value);
			}
			//messageData = extend(messageData, jsonData);
		}


		msg.data = event_contents;

		return new Message(messageData);
	},


	sendEvent: function(deviceID, published_at, event_topic, event_contents) {
		var dfd = when.defer();

		var client = AzureHelper.getClientForDevice(deviceID);
		var message = AzureHelper.getMessage(deviceID, published_at, event_topic, event_contents);

		var transport = client._transport;

		transport.sendEvent(message, function(err) {
			if (err) {
				dfd.reject(err);
			}
			else {
				dfd.resolve();
			}
		});

		return dfd.promise;
	},

	_: null
};
module.exports = AzureHelper;
