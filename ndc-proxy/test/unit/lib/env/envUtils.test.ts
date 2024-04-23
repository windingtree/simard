import {toMultiline} from '../../../../src/lib/env';

describe('envUtils.ts', () => {
    describe('#toMultiline', () => {
        expect(
            toMultiline('multi\nline\nenv\nvariable'))
            .toEqual(`multi
line
env
variable`);
    });
    });
