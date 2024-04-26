import "dotenv/config";
import { CancelDeadline, CancelPolicy, ChargeBase, PenaltyCharge } from "@simardwt/derbysoft-types";
import { toCancelDeadLine, toPenaltyAmount, toRefundabilityPolicy } from "./refundability";

describe("refundability functions are working properly", () => {
  describe("toRefundabilityPolicy is working properly", () => {
    it("non refundable", () => {
      const cancelPenalty: CancelPolicy = {
        code: "AD100P_100P",
        description: "Non Refundable",
        cancelPenalties: [
          {
            noShow: false,
            cancellable: true,
            cancelDeadline: {
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
              dealineTime: "any date time",
            },
            penaltyCharge: {
              chargeBase: ChargeBase["FullStay"],
              percent: 100,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: ChargeBase["FullStay"],
              percent: 100,
            },
          },
        ],
      };
      const output = toRefundabilityPolicy(
        cancelPenalty,
        "2023-10-15",
        "1000",
        "5000",
        "JPY",
        "Asia/Tokyo"
      );
      expect(output).toEqual({
        type: "non_refundable",
        caption: "Non-Refundable",
        description: "Non Refundable",
      });
    });

    it("refundable", () => {
      const cancelPenalty: CancelPolicy = {
        code: "4PM0D1N_100P",
        description: "cancel before 4PM of arrival date is free",
        cancelPenalties: [
          {
            noShow: false,
            cancellable: true,
            cancelDeadline: {
              offsetTimeDropType: "BeforeArrival",
              offsetTimeUnit: "D",
              offsetTimeValue: 0,
              dealineTime: "4PM",
            },
            penaltyCharge: {
              chargeBase: ChargeBase["NightBase"],
              nights: 1,
            },
          },
          {
            noShow: true,
            penaltyCharge: {
              chargeBase: ChargeBase["FullStay"],
              percent: 100,
            },
          },
        ],
      };
      const output = toRefundabilityPolicy(
        cancelPenalty,
        "2023-10-15",
        "1000",
        "5000",
        "JPY",
        "Asia/Tokyo"
      );
      expect(output).toStrictEqual({
        type: "refundable_with_deadline",
        deadline: "2023-10-15T16:00:00.000+09:00",
        penaltyAmount: "1000",
        description: "cancel before 4PM of arrival date is free",
        caption: "Refundable with Deadline",
      });
    });
  });

  describe("toCancelDeadLine is working properly", () => {
    const testTable: [CancelDeadline, string, string, string][] = [
      [
        {
          offsetTimeDropType: "BeforeArrival",
          offsetTimeUnit: "D",
          offsetTimeValue: 1,
          dealineTime: "4PM",
        },
        "2023-10-15",
        "Asia/Tokyo",
        "2023-10-14T16:00:00.000+09:00",
      ],
      [
        {
          offsetTimeDropType: "BeforeArrival",
          offsetTimeUnit: "H",
          offsetTimeValue: 4,
          dealineTime: "8AM",
        },
        "2023-10-15",
        "Asia/Tokyo",
        "2023-10-15T04:00:00.000+09:00",
      ],
      [
        {
          offsetTimeDropType: "BeforeArrival",
          offsetTimeUnit: "H",
          offsetTimeValue: 4,
        },
        "2023-10-15",
        "Asia/Tokyo",
        "2023-10-14T20:00:00.000+09:00",
      ],
      [{}, "2023-10-15", "Asia/Tokyo", "2023-10-15T00:00:00.000+09:00"],
    ];

    it.each(testTable)(
      "test %#",
      (cancelDeadLine: CancelDeadline, date: string, timezone: string, expected: string) => {
        expect(toCancelDeadLine(cancelDeadLine, date, timezone)).toBe(expected);
      }
    );
  });

  describe("toPenaltyAmount is working properly", () => {
    const testTable: [PenaltyCharge, string, string, number, string][] = [
      [
        {
          chargeBase: ChargeBase["FullStay"],
          percent: 100,
        },
        "50",
        "300",
        0,
        "300",
      ],
      [
        {
          chargeBase: ChargeBase["FullStay"],
          percent: 30,
        },
        "50",
        "300",
        2,
        "90.00",
      ],
      [
        {
          chargeBase: ChargeBase["NightBase"],
          nights: 2,
        },
        "50",
        "300",
        1,
        "100.0",
      ],
      [
        {
          chargeBase: ChargeBase["Amount"],
          amount: 123.45,
        },
        "50",
        "300",
        2,
        "123.45",
      ],
    ];

    it.each(testTable)(
      "test %#",
      (
        penaltyCharge: PenaltyCharge,
        nightPrice: string,
        fullStayPrice: string,
        decimals: number,
        expected: string
      ) => {
        expect(toPenaltyAmount(penaltyCharge, nightPrice, fullStayPrice, decimals)).toBe(expected);
      }
    );
  });
});
