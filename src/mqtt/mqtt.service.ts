import { Injectable, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';

// service for mqtt instance can be used in other modules
//  and reusable in other services in one connection

@Injectable()
export class MqttService {
  private client: mqtt.Client;
  private isConnected = false;
  private readonly logger = new Logger(MqttService.name);

  constructor() {
    this.client = mqtt.connect({
      host: 'mqtt.flespi.io',
      port: 1883,
      protocol: 'tcp',
      clientId: 'mqtt-nestjs-2',
      username:
        'Iprph6INKxpdaijmBzlyq63jqo1GRsWpFeCLabmJwBMuJTH8iQwwNqD3CuxkKkxg',
      password:
        'Iprph6INKxpdaijmBzlyq63jqo1GRsWpFeCLabmJwBMuJTH8iQwwNqD3CuxkKkxg',
      reconnectPeriod: 1,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Connected to MQTT broker');
    });

    this.client.on('message', (topic, message) => {
      this.logger.log(`Received message on topic ${topic}: ${message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.log('Disconnected from MQTT broker');
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT connection error:', error);
    });
  }

  // subscribe to topics and register callback
  subscribe(
    topics: string[],
    callback: mqtt.OnMessageCallback,
    callbackSub?: () => void,
  ) {
    if (this.isConnected) {
      this.client.subscribe(topics, (error) => {
        if (!error) {
          this.client.on('message', callback);
          this.logger.log(`Subscribed to topics ${topics}`);
          if (callbackSub) {
            callbackSub();
          }
        } else {
          this.logger.error(`Cannot subscribe to topic ${topics}`, error);
        }
      });
    } else {
      this.logger.error(`Cannot subscribe to topic ${topics}, not connected`);
    }
  }

  // unsubscribe from topics
  unsubscribe(topic: string | string[]) {
    if (this.isConnected) {
      this.client.unsubscribe(topic);
    } else {
      this.logger.error(
        `Cannot unsubscribe from topic ${topic}, not connected`,
      );
    }
  }

  // publish message to topic
  publish(topic: string, message: any) {
    if (this.isConnected) {
      // qos: 1 for at least once delivery success
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
    } else {
      this.logger.error(`Cannot publish to topic ${topic}, not connected`);
    }
  }

  // disconnect from broker
  disconnect() {
    if (this.isConnected) {
      this.client.end();
      this.isConnected = false;
    }
  }
}
