import {BaseGliderException} from '../../api/errors';
import {HttpStatusCode} from '../../api/errors';
import {ErrorCodes} from '../../api/errors';

export function orgIDtoDIDFormat(orgID: string): string {
    if (!orgID) {
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'Missing orgID', ErrorCodes.INVALID_ORGID );
    }
    if (orgID.startsWith('did:orgid:')) {
        return orgID;
    }
    return `did:orgid:${orgID}`;
}

export function didFormatToORGiD(didFormat: string): string {
    const format = 'did:orgid:(.*)';
    const regex = new RegExp(format);
    if (!regex.test(didFormat)) {
        throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Invalid did ID format`, ErrorCodes.INVALID_ORGID);
    }
    const result = didFormat.match(/did:orgid:([0-9]{0,}:)?([0-9a-z]*){1}(#.*){0,1}/);
    return result[2];
}
