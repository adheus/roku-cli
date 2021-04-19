import { EventEmitter } from 'events';
import * as xmlParser from 'fast-xml-parser';
import * as http from 'http';
import { Client as Client, SsdpHeaders } from 'node-ssdp';
import * as url from 'url';

const DEFAULT_TIMEOUT = 10000;

class RokuFinder extends EventEmitter {

    constructor() {
        super();

        this.client = new Client();

        this.client.on('response', (headers: SsdpHeaders) => {
            if (!this.running) {
                return;
            }

            const { ST, LOCATION } = headers;
            if (ST && LOCATION && ST.indexOf('roku') !== -1) {
                http.get(`${LOCATION}/query/device-info`, {
                    headers: {
                        'User-Agent': 'https://github.com/adheus/roku-cli'
                    }
                }, (resp) => {
                    // Get the device info
                    let data = '';

                    resp.on('data', (chunk) => {
                        // A chunk of data has been received.
                        data += chunk;
                    });

                    resp.on('end', () => {
                        // The whole response has been received.
                        let info = xmlParser.parse(data);
                        const device = this.parseAddress(LOCATION);
                        device.deviceInfo = info['device-info'];
                        this.emit('found', device);
                    });
                });
            }
        });
    }

    private readonly client: Client;
    private intervalId: NodeJS.Timer | null = null;
    private timeoutId: NodeJS.Timer | null = null;
    private running: boolean = false;

    public start(timeout: number) {
        this.running = true;

        const search = () => {
            this.client.search('roku:ecp');
        };

        const done = () => {
            this.stop();
            this.emit('timeout');
        };

        search();
        this.intervalId = setInterval(search, 1000);
        this.timeoutId = setTimeout(done, timeout);
    }

    public stop() {
        clearInterval(this.intervalId!);
        clearTimeout(this.timeoutId!);
        this.running = false;
        this.client.stop();
    }

    private parseAddress(location: string): any {
        const parts = url.parse(location);
        parts.path = undefined;
        parts.pathname = undefined;
        return { location: url.format(parts), ip: parts.hostname, deviceInfo: {} };
    }
}
