import fs from 'fs';
import path from 'path';
const SAMPLES_FOLDER = path.join(__dirname, '/sampledata/');

export const loadSampleFile = async (filename: string): Promise<string> => await fs.readFileSync(path.join(SAMPLES_FOLDER, filename), 'utf8');
export const writeSampleFile = async (filename: string, content: any): Promise<void> => await fs.writeFileSync( path.join(SAMPLES_FOLDER, filename), content);

export const assertProperty = (object: any, value?: any, type?: any): void => {
    if (type) {
        expect(object).toBeInstanceOf(type);
    }
    if (value) {
        expect(object).toEqual(value);
    }
};

// export const loadSampleFile = async () => {};
