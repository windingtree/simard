import {convertToDateString, DateFormat} from '../../../../src/lib/utils/DateUtils';

describe('DateUtils.ts', () => {
    describe('#convertToDateString()', () => {
        test('Should format date to YYYY-MM-DD format', () => {
            const date = new Date(2021, 10, 25, 11, 35, 20);
            const strDate = convertToDateString(date, DateFormat.YYYY_MM_DD);
            expect(strDate).toBe('2021-11-25');
        });

    });

});
