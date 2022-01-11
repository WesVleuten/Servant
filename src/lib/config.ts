import { ApplicationConfig } from '../interfaces/appConfig';
import * as fs from 'fs-extra';

const config: ApplicationConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

export default config;
