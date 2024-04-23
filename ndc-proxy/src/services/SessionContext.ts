
/**
 * This object is meant to store various info about Glider API client session
 * Things like:
 * -client ORGiD
 * -endpoint IP address
 * -sessionID
 * -etc
 *
 */

export interface SessionContext {
    clientORGiD?: string;
    clientIPAddress?: string;

    // booking fee related
    isBookingFeeRequired?: boolean;
    bookingFeeCurrencyCode?: string;
    bookingFeeAmount?: number;

    isDBFEnabled?: boolean; // should DBF be requested (UA)
}
