import {didFormatToORGiD, orgIDtoDIDFormat} from '../../../../src/lib/jwt';

const orgID = '0xdc27bdf9b28c1973ffd6200a93ab63a914a78f71e64c4a310e0b1484d5583d49';
const didID = `did:orgid:${orgID}`;
const didIDWithChain = `did:orgid:5:${orgID}`;
const keyID = `webserver`;
const didIDWithKey = `did:orgid:${orgID}#${keyID}`;
const didIDWithKeyAndChain = `did:orgid:5:${orgID}#${keyID}`;

describe('orgIDUtils.ts', () => {
    describe('#orgIDtoDIDFormat', () => {
        it('should convert orgID to DID format if it was not yet in that format',  () => {
            const actualDID = orgIDtoDIDFormat(orgID);
            expect(actualDID).toEqual(didID);
        });
        it('should not convert if it is already in DID format',  () => {
            let actualDID = orgIDtoDIDFormat(didID);
            expect(actualDID).toEqual(didID);
            actualDID = orgIDtoDIDFormat(didIDWithChain);
            expect(actualDID).toEqual(didIDWithChain);
        });
    });
    describe('#didFormatToORGiD', () => {
        it('should extract ORGiD from DID format when input is DID format (without keyID)',  () => {
            let actualDID = didFormatToORGiD(didID);
            expect(actualDID).toEqual(orgID);
            actualDID = didFormatToORGiD(didIDWithChain);
            expect(actualDID).toEqual(orgID);
        });
        it('should extract ORGiD from DID format when input is DID format (with keyID)',  () => {
            let actualDID = didFormatToORGiD(didIDWithKey);
            expect(actualDID).toEqual(orgID);
            actualDID = didFormatToORGiD(didIDWithKeyAndChain);
            expect(actualDID).toEqual(orgID);
        });

        it('should throw error when input is not according to DID format',  () => {
            expect(() => didFormatToORGiD('Invalid did ID format')).toThrowError();
        });

    });
});
