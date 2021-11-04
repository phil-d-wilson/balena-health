const logger = require('./logger');
const config = require('./config');
const axios = require('axios').default;
const mqtt = require('mqtt');

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const isMqttBrokerActive = async () => {
  const url = `${config.supervisorAddr}/v2/applications/state?apikey=${config.supervisorApiKey}`;
  const response = await axios.get(url);
  const services = response.data[config.fleetName].services;
  if (Object.keys(services).includes('mqtt')) {
    logger.debug('The mqtt service is active; data will be routed');
    return true;
  } else {
    logger.warn('There is no service named mqtt detected; date will not be routed');
    return false;
  }
};

const getMqttClient = async () => {
  // Connect to the mqtt service
  const client = mqtt.connect('mqtt://localhost', 1883, 60);

  // Subscribe to the balena topic to ensure BPM is being sent
  client.on('connect', function () {
    logger.debug('MQTT Connected');
    client.subscribe('balena', function (err) {
      if (err) throw new Error("Failed to subscribe to the 'balena' topic; data will not be routed");
    });
  });

  client.on('disconnect', function () {
    logger.debug('MQTT Disconnected');
  });

  client.on('message', function (topic, message) {
    logger.debug('MQTT Message Sent: ' + message.toString());
  });

  return client;
};

module.exports = { sleep, getMqttClient, isMqttBrokerActive };