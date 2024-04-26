import "dotenv/config";
import { RoomRate } from "@simardwt/derbysoft-types";
import { plainToClass } from "class-transformer";
import { computePriceAndTaxes } from "./priceCalculator";

describe("Test computePriceAndTaxes", () => {
  it("amountBeforeTax", () => {
    const roomRateEx = {
      amountBeforeTax: [25, 20, 10, 45],
      cancelPolicy: {
        cancelPenalties: [
          {
            cancelDeadline: {
              dealineTime: "any date time",
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
            },
            cancellable: true,
            noShow: false,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
        ],
        code: "AD100P_100P",
        description: "Non Refundable",
      },
      currency: "USD",
      fees: [
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
      ],
      inventory: 20,
      mealPlan: "RO",
      rateId: "PROMO",
      roomCriteria: {
        adultCount: 3,
        childAges: [],
        childCount: 0,
        roomCount: 2,
      },
      roomId: "T2",
    };

    const roomRate = plainToClass(RoomRate, roomRateEx);
    const { price, taxItems, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
      roomRate,
      roomRate.roomCriteria
    );

    expect(price.currency).toBe("USD");
    expect(price.public).toBe("290.00");
    expect(price.taxes).toBe("90.00");

    expect(taxItems[0].amount).toBe("60.00");
    expect(taxItems[0].description).toBe("Occupancy Tax");

    expect(taxItems[1].amount).toBe("30.00");
    expect(taxItems[1].description).toBe("City Tax");

    expect(totalAmountBeforeTax).toBe("200.00");
    expect(totalAmountAfterTax).toBe("0.00");
  });

  it("amountBeforeTax inclusive taxes", () => {
    const roomRateEx = {
      amountBeforeTax: [25, 20, 10, 45],
      cancelPolicy: {
        cancelPenalties: [
          {
            cancelDeadline: {
              dealineTime: "any date time",
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
            },
            cancellable: true,
            noShow: false,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
        ],
        code: "AD100P_100P",
        description: "Non Refundable",
      },
      currency: "USD",
      fees: [
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
            type: "Inclusive",
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
            type: "Inclusive",
          },
        },
      ],
      inventory: 20,
      mealPlan: "RO",
      rateId: "PROMO",
      roomCriteria: {
        adultCount: 3,
        childAges: [],
        childCount: 0,
        roomCount: 2,
      },
      roomId: "T2",
    };

    const roomRate = plainToClass(RoomRate, roomRateEx);
    const { price, taxItems, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
      roomRate,
      roomRate.roomCriteria
    );

    expect(price.currency).toBe("USD");
    expect(price.public).toBe("200.00");
    expect(price.taxes).toBe("86.09");

    expect(taxItems[0].amount).toBe("60.00");
    expect(taxItems[0].description).toBe("Occupancy Tax");

    expect(taxItems[1].amount).toBe("26.09");
    expect(taxItems[1].description).toBe("City Tax");

    expect(totalAmountBeforeTax).toBe("200.00");
    expect(totalAmountAfterTax).toBe("0.00");
  });

  it("amountAfterTax", () => {
    const roomRateEx = {
      amountAfterTax: [108, 108, 108, 108],
      cancelPolicy: {
        cancelPenalties: [
          {
            cancelDeadline: {
              dealineTime: "any date time",
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
            },
            cancellable: true,
            noShow: false,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
        ],
        code: "AD100P_100P",
        description: "Non Refundable",
      },
      currency: "CNY",
      inventory: 20,
      mealPlan: "RO",
      rateId: "PROMO",
      roomCriteria: {
        adultCount: 3,
        childAges: [],
        childCount: 0,
        roomCount: 2,
      },
      roomId: "T2",
    };

    const roomRate = plainToClass(RoomRate, roomRateEx);
    const { price, taxItems, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
      roomRate,
      roomRate.roomCriteria
    );

    expect(price.currency).toBe("CNY");
    expect(price.public).toBe("864.00");
    expect(price.taxes).toBe("0.00");

    expect(taxItems.length).toBe(0);

    expect(totalAmountBeforeTax).toBe("0.00");
    expect(totalAmountAfterTax).toBe("864.00");
  });

  it("both amountBeforeTax and amountAfterTax", () => {
    const roomRateEx = {
      amountAfterTax: [108, 108, 108, 108],
      amountBeforeTax: [25, 25, 25, 25],
      cancelPolicy: {
        cancelPenalties: [
          {
            cancelDeadline: {
              dealineTime: "any date time",
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
            },
            cancellable: true,
            noShow: false,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
        ],
        code: "AD100P_100P",
        description: "Non Refundable",
      },
      currency: "CNY",
      fees: [
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
            type: "Inclusive",
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
            type: "Inclusive",
          },
        },
      ],
      inventory: 20,
      mealPlan: "RO",
      rateId: "PROMO",
      roomCriteria: {
        adultCount: 3,
        childAges: [],
        childCount: 0,
        roomCount: 2,
      },
      roomId: "T2",
    };

    const roomRate = plainToClass(RoomRate, roomRateEx);
    const { price, taxItems, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
      roomRate,
      roomRate.roomCriteria
    );

    expect(price.currency).toBe("CNY");
    expect(price.public).toBe("864.00");
    expect(price.taxes).toBe("86.09");

    expect(taxItems[0].amount).toBe("60.00");
    expect(taxItems[0].description).toBe("Occupancy Tax");

    expect(taxItems[1].amount).toBe("26.09");
    expect(taxItems[1].description).toBe("City Tax");

    expect(totalAmountBeforeTax).toBe("200.00");
    expect(totalAmountAfterTax).toBe("864.00");
  });

  it("both amountBeforeTax amountAfterTax and exclusive taxes", () => {
    const roomRateEx = {
      amountAfterTax: [108, 108, 108, 108],
      amountBeforeTax: [25, 25, 25, 25],
      cancelPolicy: {
        cancelPenalties: [
          {
            cancelDeadline: {
              dealineTime: "any date time",
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
            },
            cancellable: true,
            noShow: false,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: "FullStay",
              percent: 100,
            },
          },
        ],
        code: "AD100P_100P",
        description: "Non Refundable",
      },
      currency: "CNY",
      fees: [
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
      ],
      inventory: 20,
      mealPlan: "RO",
      rateId: "PROMO",
      roomCriteria: {
        adultCount: 3,
        childAges: [],
        childCount: 0,
        roomCount: 2,
      },
      roomId: "T2",
    };

    const roomRate = plainToClass(RoomRate, roomRateEx);
    const { price, taxItems, totalAmountAfterTax, totalAmountBeforeTax } = computePriceAndTaxes(
      roomRate,
      roomRate.roomCriteria
    );

    expect(price.currency).toBe("CNY");
    expect(price.public).toBe("864.00");
    expect(price.taxes).toBe("90.00");

    expect(taxItems[0].amount).toBe("60.00");
    expect(taxItems[0].description).toBe("Occupancy Tax");

    expect(taxItems[1].amount).toBe("30.00");
    expect(taxItems[1].description).toBe("City Tax");

    expect(totalAmountBeforeTax).toBe("200.00");
    expect(totalAmountAfterTax).toBe("864.00");
  });
});
