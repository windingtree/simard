import * as express from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import * as path from 'path';

export const publicLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    if (settings) {
        const expressApp = settings.getData('express_app');
        expressApp
            // Serve static files like images from the public folder
            .use(express.static(path.join(__dirname, '..', 'public'), { maxAge: 31557600000 }));
    }
};
