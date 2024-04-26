import "dotenv/config";
import { Fee, FeeWithDate } from "@simardwt/derbysoft-types";
import Big from "big.js";
import { plainToClass, plainToInstance } from "class-transformer";
import { computeFeeAmount, extractTax, processFee, processTaxesAndCharges } from "./taxProcessor";

describe("Test computeFeeAmount", () => {
  it("percentage amount", () => {
    const fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Percent",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Exclusive",
    });

    let res: Big;
    res = computeFeeAmount(fee, new Big(100), new Big(0), 1, 1, 1);
    expect(res.toFixed(2)).toBe("15.00");

    res = computeFeeAmount(fee, new Big(0), new Big(100), 1, 1, 1);
    expect(res.toFixed(2)).toBe("13.04");

    res = computeFeeAmount(fee, new Big(100), new Big(110), 1, 1, 1);
    expect(res.toFixed(2)).toBe("15.00");

    res = computeFeeAmount(fee, new Big(0), new Big(0), 1, 1, 1);
    expect(res.toFixed(2)).toBe("0.00");
  });

  it("Fix amount", () => {
    let fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Fix",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Exclusive",
    });

    let res: Big;
    const [nbOfRooms, nbOfPersons, nbOfNights] = [2, 3, 4];
    res = computeFeeAmount(fee, new Big(100), new Big(100), nbOfRooms, nbOfPersons, nbOfNights);
    expect(res.toFixed(2)).toBe("120.00");

    fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Fix",
      chargeType: "PerPersonPerNight",
      name: "City Tax",
      type: "Exclusive",
    });

    res = computeFeeAmount(fee, new Big(100), new Big(100), nbOfRooms, nbOfPersons, nbOfNights);
    expect(res.toFixed(2)).toBe("180.00");

    fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Fix",
      chargeType: "PerRoomPerStay",
      name: "City Tax",
      type: "Exclusive",
    });

    res = computeFeeAmount(fee, new Big(100), new Big(100), nbOfRooms, nbOfPersons, nbOfNights);
    expect(res.toFixed(2)).toBe("30.00");

    fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Fix",
      chargeType: "PerPersonPerStay",
      name: "City Tax",
      type: "Exclusive",
    });

    res = computeFeeAmount(fee, new Big(100), new Big(100), nbOfRooms, nbOfPersons, nbOfNights);
    expect(res.toFixed(2)).toBe("45.00");

    fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Fix",
      chargeType: "Other",
      name: "City Tax",
      type: "Exclusive",
    });

    res = computeFeeAmount(fee, new Big(100), new Big(100), nbOfRooms, nbOfPersons, nbOfNights);
    expect(res.toFixed(2)).toBe("15.00");
  });

  it("Wrong amountType", () => {
    const fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Other",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Exclusive",
    });

    const res = computeFeeAmount(fee, new Big(100), new Big(100), 1, 1, 1);
    expect(res.toFixed(2)).toBe("0.00");
  });
});

describe("Test processFee", () => {
  it("Exclusive Fee", () => {
    const fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Percent",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Exclusive",
    });

    const { displayAmount, payableAmount } = processFee(fee, new Big(100), new Big(0), 1, 1, 1);
    expect(displayAmount.toFixed(2)).toBe("15.00");
    expect(payableAmount.toFixed(2)).toBe("15.00");
  });

  it("Inclusive Fee", () => {
    const fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Percent",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Inclusive",
    });

    const { displayAmount, payableAmount } = processFee(fee, new Big(100), new Big(0), 1, 1, 1);
    expect(displayAmount.toFixed(2)).toBe("13.04");
    expect(payableAmount.toFixed(2)).toBe("0.00");
  });

  it("Other", () => {
    const fee = plainToClass(Fee, {
      amount: 15,
      amountType: "Percent",
      chargeType: "PerRoomPerNight",
      name: "City Tax",
      type: "Other",
    });

    const { displayAmount, payableAmount } = processFee(fee, new Big(100), new Big(0), 1, 1, 1);
    expect(displayAmount.toFixed(2)).toBe("0.00");
    expect(payableAmount.toFixed(2)).toBe("0.00");
  });
});

describe("Test processTaxesAndCharges", () => {
  it("Two taxes", () => {
    const feesEx = [
      {
        dateRange: {
          endDate: "2023-01-29",
          startDate: "2023-01-25",
        },
        fee: {
          amount: 5,
          amountType: "Fix",
          chargeType: "PerPersonPerNight",
          name: "Occupancy Tax",
          type: "Exclusive",
        },
      },
      {
        dateRange: {
          endDate: "2023-01-29",
          startDate: "2023-01-25",
        },
        fee: {
          amount: 15,
          amountType: "Percent",
          chargeType: "PerRoomPerNight",
          name: "City Tax",
          type: "Exclusive",
        },
      },
      {
        dateRange: {
          endDate: "2023-01-29",
          startDate: "2023-01-25",
        },
        fee: {
          amount: 10,
          amountType: "Fix",
          chargeType: "PerRoomPerNight",
          name: "Other Tax",
          type: "Inclusive",
        },
      },
    ];

    const [totalAmountBeforeTax, totalAmountAfterTax] = [new Big(100), new Big(0)];
    const taxAndCharges = processTaxesAndCharges(
      plainToInstance(FeeWithDate, feesEx),
      totalAmountBeforeTax,
      totalAmountAfterTax,
      2,
      1,
      1,
      1
    );

    expect(taxAndCharges.totalTaxesPayable.toFixed(2)).toBe("20.00");
    expect(taxAndCharges.totalTaxesDisplay.toFixed(2)).toBe("30.00");

    expect(taxAndCharges.taxItems[0].amount).toBe("5.00");
    expect(taxAndCharges.taxItems[0].description).toBe("Occupancy Tax");

    expect(taxAndCharges.taxItems[1].amount).toBe("15.00");
    expect(taxAndCharges.taxItems[1].description).toBe("City Tax");

    expect(taxAndCharges.taxItems[2].amount).toBe("10.00");
    expect(taxAndCharges.taxItems[2].description).toBe("Other Tax");
  });

  describe("Test extractTax", () => {
    it("Extract one tax", () => {
      const taxValue = extractTax(new Big(100), 10);
      expect(taxValue.toFixed(2)).toBe("9.09");
    });
  });
});
