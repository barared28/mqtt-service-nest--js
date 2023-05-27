import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('command')
  async comment(
    @Body('mac_address') macs: string[],
    @Body('command') command: any,
  ): Promise<any> {
    return await this.appService.command(macs, command);
  }
}
