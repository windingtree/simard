import { Avail } from "./avail";

export interface Booking extends Avail {
  CardType: string;
  CreditCard: string;
  ExpiryDate: string;
  GuestTitle: string;
  GuestInitial: string;
  GuestSurname: string;
  Address1: string;
  PostCode: string;
  Telephone: string;
  EmailAddress: string;
  BookingCompanyName: string;
  BookingType?: string;
  SpecialRequirementsText?: string;
}

export const booking: Booking[] = [
  {
    Test: "1",
    Arrival: new Date("14-Dec-23"),
    Nights: 1,
    Property: "LEIFOR",
    CellCode: "XMLBB",
    Rooms: 2,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    CardType: "VI",
    CreditCard: "4128 0031 4829 5531",
    ExpiryDate: "Oct-23",
    GuestTitle: "X",
    GuestInitial: "K",
    GuestSurname: "Tester",
    Address1: "1 The High Street",
    PostCode: "AA1 1AA",
    Telephone: "0208 123 4567",
    EmailAddress: "test@whitbread.com",
    BookingCompanyName: "SIMARD",
    BookingType: "Leisure",
    SpecialRequirementsText: "",
  },
  {
    Test: "2",
    Arrival: new Date("14-Dec-23"),
    Nights: 2,
    Property: "GATMTI",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 1,
    Cot: "No",
    Disabled: "No",
    Double: "No",
    CardType: "AM",
    CreditCard: "3707 7777 0000 771",
    ExpiryDate: "May-27",
    GuestTitle: "Mrs",
    GuestInitial: "R",
    GuestSurname: "Blue",
    Address1: "1 The High Street",
    PostCode: "AA1 1AA",
    Telephone: "0208 123 4567",
    EmailAddress: "test@whitbread.com",
    BookingCompanyName: "SIMARD",
    BookingType: "Leisure",
    SpecialRequirementsText: "Will be arriving late",
  },
  {
    Test: "3",
    Arrival: new Date("14-Dec-23"),
    Nights: 1,
    Property: "LONGOO",
    CellCode: "HUBFB",
    Rooms: 1,
    Adults: 2,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    CardType: "VI",
    CreditCard: "4128 0031 4829 5531",
    ExpiryDate: "Jul-24",
    GuestTitle: "Mr",
    GuestInitial: "U",
    GuestSurname: "Red",
    Address1: "1 The High Street",
    PostCode: "AA1 1AA",
    Telephone: "0208 123 4567",
    EmailAddress: "test@whitbread.com",
    BookingCompanyName: "SIMARD",
    BookingType: "Leisure",
    SpecialRequirementsText: "",
  },
  {
    Test: "4",
    Arrival: new Date("14-Dec-23"),
    Nights: 3,
    Property: "MUNCIT",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    CardType: "VI",
    CreditCard: "4128 0031 4829 5531",
    ExpiryDate: "Apr-24",
    GuestTitle: "Ms",
    GuestInitial: "E",
    GuestSurname: "Green",
    Address1: "1 The High Street",
    PostCode: "AA1 1AA",
    Telephone: "0208 123 4567",
    EmailAddress: "test@whitbread.com",
    BookingCompanyName: "SIMARD",
    BookingType: "Leisure",
    SpecialRequirementsText: "Early Departure",
  },
];
