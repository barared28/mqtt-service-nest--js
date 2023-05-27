import { Injectable, Logger } from '@nestjs/common';
import { MqttService } from './mqtt/mqtt.service';

@Injectable()
export class AppService {
  constructor(private readonly mqttService: MqttService) {}
  private readonly logger = new Logger(MqttService.name);

  // check online devices
  async checkingOnlineDevices(topics: string[]) {
    const checking = () =>
      // promise to check online devices
      new Promise<string>((resolve, reject) => {
        // prepare topics for subscribe
        const topicsSubscribed = topics.map((topic) => 'device/' + topic);
        // prepare topics for publish
        const topicsCommand = topics.map((topic) => 'user/' + topic);
        // subscribe to topics
        this.mqttService.subscribe(
          topicsSubscribed,
          (topic, message) => {
            if (topicsSubscribed.includes(topic)) {
              // return first active device
              resolve(topics[topicsSubscribed.indexOf(topic)]);
              // unsubscribe from topics
              this.mqttService.unsubscribe(topicsSubscribed);
              this.logger.log(
                `Devices active ${topics[topicsSubscribed.indexOf(topic)]}`,
              );
            }
          },
          () => {
            topicsCommand.forEach((topic) => {
              this.mqttService.publish(topic, {
                message: 'ping',
              });
              this.logger.log(`ping sent to ${topic}`);
            });
          },
        );
        // reject if timeout
        setTimeout(() => {
          reject('timeout');
        }, 1000 * 60 * 5);
      });
    return await checking();
  }

  // send command to device
  async command(macs: string[], command: any): Promise<any> {
    // TODO: adding logic for checking online devices who saved on redis

    // check online devices and return active device mac address
    // TODO: after get active device mac address, save it to redis with ttl
    const activeDevice = await this.checkingOnlineDevices(macs);
    if (activeDevice) {
      // publish command to active device
      this.mqttService.publish('user/' + activeDevice, command);
      this.logger.log(`Command sent to ${activeDevice}`);

      // return response
      return {
        status: 'success',
        message: `Command sent to ${activeDevice}`,
        command,
      };
    }
  }
}
