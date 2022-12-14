import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import handlebars from 'handlebars';
import * as hbsf from 'handlebars-dateformat';
import { join } from 'path';
import { AppModule } from './web/app.module';
import { initBot } from './bot'
import * as fs from "fs";

import * as localtunnel from "localtunnel";
import { config } from './bot/config';
import { isProduction, googleCredentials } from './env';

fs.writeFileSync('./google-credentials.json', googleCredentials);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  handlebars.registerHelper('dateFormat', hbsf);

  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  if(isProduction){
    await initBot(config.serverUrl);
  }
  else {
    //const tunnel = await localtunnel({ port: 8080, subdomain: config.localTunnelDomain });
    await initBot(config.serverUrl)//(tunnel.url);
    //tunnel.on('close', () => {
    //   bootstrap()
    //});
  }
  await app.listen(process.env.PORT || 8080,'0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
