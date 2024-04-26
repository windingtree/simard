export type YesNo = "Yes" | "No";

export interface Avail {
  Test: string;
  Arrival: Date;
  Nights: number;
  Property: string;
  CellCode: string;
  Rooms: number;
  Adults: number;
  Children: number;
  Cot: YesNo;
  Disabled: YesNo;
  Double: YesNo;
  doNotCancelAfter?: boolean;
}

export const avail: Avail[] = [
  {
    Test: "1",
    Arrival: new Date("28-Jan-24"),
    Nights: 1,
    Property: "MUNCIT",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "2",
    Arrival: new Date("28-Jan-24"),
    Nights: 2,
    Property: "DUBAIR",
    CellCode: "none",
    Rooms: 1,
    Adults: 2,
    Children: 1,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "3",
    Arrival: new Date("28-Jan-24"),
    Nights: 3,
    Property: "LONGOO",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "4",
    Arrival: new Date("28-Jan-24"),
    Nights: 2,
    Property: "LEIFOR",
    CellCode: "none",
    Rooms: 1,
    Adults: 2,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "No",
    doNotCancelAfter: true,
  },
];

export const liveAvail: Avail[] = [
  {
    Test: "5",
    Arrival: new Date("28-Jan-24"),
    Nights: 1,
    Property: "MUNCIT",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "6",
    Arrival: new Date("28-Jan-24"),
    Nights: 2,
    Property: "DUBAIR",
    CellCode: "none",
    Rooms: 1,
    Adults: 2,
    Children: 1,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "7",
    Arrival: new Date("28-Jan-24"),
    Nights: 3,
    Property: "LONGOO",
    CellCode: "none",
    Rooms: 1,
    Adults: 1,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "Yes",
    doNotCancelAfter: true,
  },
  {
    Test: "8",
    Arrival: new Date("28-Jan-24"),
    Nights: 2,
    Property: "LEIFOR",
    CellCode: "none",
    Rooms: 1,
    Adults: 2,
    Children: 0,
    Cot: "No",
    Disabled: "No",
    Double: "No",
    doNotCancelAfter: true,
  },
];
