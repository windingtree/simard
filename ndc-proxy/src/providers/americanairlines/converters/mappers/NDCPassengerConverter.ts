import {
    Civility,
    FrequentFlyerAccount,
    Gender,
    Passenger,
    PassengerSearchCriteria,
    PassengerType
} from '../../../../interfaces/glider';
import {NDCContactInformation, NDCFrequentFlyer, NDCPassenger, NDCPassengerType} from '../../../../interfaces/ndc';
import {AbstractGliderDataTypeConverter} from './AbstractGliderDataTypeConverter';
import moment from 'moment';

export class NDCPassengerConverter extends AbstractGliderDataTypeConverter<Passenger, NDCPassenger> {
    constructor() {
        super();
    }

    /**
     * Convert entire map (received from Glider API, search/seatmap/orderrreate) to array of passengers in NDC format
     * @param passengers
     */
    public convertPassengersMapFromGlider(passengers: Map<string, Passenger>): NDCPassenger[] {
        const ndcPassengers: NDCPassenger[] = [];
        passengers.forEach((gliderPax, paxId) => {
            // gliderPax.paxID = paxId;
            const ndcPax = this.convertFromGlider(gliderPax);
            ndcPax.PassengerID = paxId;
            ndcPassengers.push(ndcPax);
        });
        return ndcPassengers;
    }

    /**
     * Convert single passenger from Glider format to NDC
     * @param input
     */
    public convertFromGlider(input: Passenger): NDCPassenger {
        return this.updateNDCPassengerWithGlider(input);
    }

    /**
     * Convert passenger from NDC format to glider
     * @param input
     */
    public convertToGlider(input: NDCPassenger): Passenger {
        const gliderPax = new Passenger();
        gliderPax.type = this.convertToGliderPassengerType(input.type);
        return gliderPax;
    }

    public convertFromPassengerSearchCriteriaArray(input: PassengerSearchCriteria[]): NDCPassenger[] {
        const result: NDCPassenger[] = [];
        input.map(paxCriteria => {
            const numberOfPaxOfType = paxCriteria.count;
            for (let i = 1; i <= numberOfPaxOfType; i++) {
                const ndcPassenger = this.convertFromPassengerSearchCriteria(paxCriteria);
                result.push(ndcPassenger);
            }
        });
        // assign passenger IDs in NDC formats as it is required
        let idx = 1;
        result.forEach(pax => pax.PassengerID = `T${idx++}`);

        // if we consider infants as traveling on lap (at least for United Airlines), we need to use pax IDs as 1.1 or 2.1
        // this is to indicate adult pax who travels with an infant
        let previousAdultPaxID = undefined;
        result.forEach(pax => {
            if (pax.type === NDCPassengerType.ADT) {
                previousAdultPaxID = pax.PassengerID;
            }
            if (pax.type === NDCPassengerType.INF) {
                pax.PassengerID = previousAdultPaxID + '.1';
            }
        });
        return result;
    }
    public convertFromPassengerSearchCriteria(input: PassengerSearchCriteria): NDCPassenger {
        const ndcPax = new NDCPassenger();
        ndcPax.type = this.convertFromGliderPassengerType(input.type);
        ndcPax.LoyaltyPrograms = this.convertLoyaltyPrograms(input.loyaltyPrograms);
        return ndcPax;
    }
    public convertLoyaltyPrograms(loyaltyPrograms: FrequentFlyerAccount[]): NDCFrequentFlyer[] {
        if (Array.isArray(loyaltyPrograms) && loyaltyPrograms.length > 0) {
            return loyaltyPrograms.map(value => this.convertLoyaltyProgramDetails(value));
        } else {
            return [];
        }
    }

    public convertLoyaltyProgramDetails(input: FrequentFlyerAccount): NDCFrequentFlyer {
        const ndcFQTV = new NDCFrequentFlyer();
        ndcFQTV.number = input.accountNumber;
        ndcFQTV.airlineDesignator = input.airlineCode;
        ndcFQTV.programName = input.programName;
        return ndcFQTV;
    }

    public convertContactDetailsFromGlider(input: Passenger): NDCContactInformation {
        const ndcContact = new NDCContactInformation();
        if (Array.isArray(input.contactInformation)) {
            const email = input.contactInformation.find(elem => elem.indexOf('@') !== -1);  // find first entry with '@' (email)
            const phone = input.contactInformation.find(elem => elem.indexOf('@') === -1);  // find first entry without '@' (phone)
            ndcContact.EmailAddress = email;
            ndcContact.PhoneNumber = phone;
        }

        return ndcContact;
    }

    public updateNDCPassengersWithGlider(gliderPassengers: Map<string, Passenger>, ndcPassengers: NDCPassenger[]): NDCPassenger[] {
        if (!ndcPassengers) {
            ndcPassengers = [];
        }
        if (!gliderPassengers) {
            gliderPassengers = new Map<string, Passenger>();
        }

        // for every NDC Pax, find same glider pax and update NDC pax detail from glider
        ndcPassengers.forEach(ndcPax => {
            const paxID = ndcPax.PassengerID;
            const gliderPax = gliderPassengers.get(paxID);
            if (gliderPax) {
                // we found corresponding glider PAX, use it's details to update NDC pax
                this.updateNDCPassengerWithGlider(gliderPax, ndcPax);
                ndcPax.PassengerID = paxID; // FIXME - should not be here
            }
        });
        return ndcPassengers;
    }

    public updateNDCPassengerWithGlider(input: Passenger, ndcPax: NDCPassenger= undefined): NDCPassenger {
        if (!ndcPax) {
            ndcPax = new NDCPassenger();
        }
        if (Array.isArray(input.firstnames) &&  input.firstnames.length > 0) {
            ndcPax.GivenName = input.firstnames.join(' ');
        }
        if (Array.isArray(input.lastnames) &&  input.lastnames.length > 0) {
            ndcPax.Surname = input.lastnames.join(' ');
        }
        if (Array.isArray(input.middlenames) &&  input.middlenames.length > 0) {
            ndcPax.Middlename = input.middlenames.join(' ');
        }
        const gender = input.gender || Gender.Unspecified; // default gender is Unspecified
            switch (gender) {
                case Gender.Female:
                    ndcPax.Gender = 'Female';
                    break;
                case Gender.Male:
                    ndcPax.Gender = 'Male';
                    break;
                default:
                    ndcPax.Gender = 'Unspecified';            // in many cases gender is required by airlines (esp flights to US)
            }
        const civility = input.civility || '';
            switch (civility) {
                case Civility.MR:
                    ndcPax.NameTitle = 'MR';
                    break;
                case Civility.MS:
                    ndcPax.NameTitle = 'MISS';
                    break;
                case Civility.MRS:
                    ndcPax.NameTitle = 'MRS';
                    break;
                case Civility.MX:
                    ndcPax.NameTitle = 'MX';
                    break;
                default:
                    break;
            }
        if (moment(input.birthdate).isValid()) {
            ndcPax.Birthdate = moment(input.birthdate).format('YYYY-MM-DD');
        }
        ndcPax.PassengerID = input.id;
        ndcPax.type = this.convertFromGliderPassengerType(input.type);
        if (Array.isArray(input.contactInformation)) {
            ndcPax.ContactInformation = this.convertContactDetailsFromGlider(input);
        }
        if (Array.isArray(input.loyaltyPrograms)) {
            ndcPax.LoyaltyPrograms = this.convertLoyaltyPrograms(input.loyaltyPrograms);
        }
        if (input.infantReference) {
            ndcPax.InfantRef = input.infantReference;
        }
        return ndcPax;

    }

    private convertFromGliderPassengerType(type: PassengerType): NDCPassengerType {
        switch (type) {
            case PassengerType.ADT:
                return NDCPassengerType.ADT;
            case PassengerType.CHD:
                return NDCPassengerType.CNN;
            case PassengerType.INF:
                return NDCPassengerType.INF;
            default:
                throw new Error(`Unsupported passenger type:${type}`);
        }
    }
    private convertToGliderPassengerType(type: string): PassengerType {
        switch (type.toUpperCase()) {
            case 'ADT':
                return PassengerType.ADT;
            case 'CHD':
                return PassengerType.CHD;
            case 'INF':
                return PassengerType.INF;
            default:
                throw new Error(`Unsupported passenger type:${type}`);
        }
    }
}
