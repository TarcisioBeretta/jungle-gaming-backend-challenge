import { describe, expect, it } from "bun:test";
import { Money } from "./money.value-object";
import { InvalidMoneyAmountError } from "../errors/invalid-money-amount.error";
import { NegativeMoneyError } from "../errors/negative-money.error";
import { CurrencyMismatchError } from "../errors/currency-mismatch.error";

describe("Money Value Object", () => {
  it("should create a valid Money instance", () => {
    const money = Money.from({ amount: "25.00", currency: "BRL" });
    expect(money.amount).toBe("25.00");
    expect(money.currency).toBe("BRL");
  });

  it("should normalize scale to 2 decimal places", () => {
    const money = Money.from({ amount: "25.5", currency: "BRL" });
    expect(money.amount).toBe("25.50");
  });

  it("should reject invalid formats and extra decimals", () => {
    expect(() => Money.from({ amount: "NaN", currency: "BRL" })).toThrow(
      InvalidMoneyAmountError,
    );
    expect(() => Money.from({ amount: "10.555", currency: "BRL" })).toThrow(
      InvalidMoneyAmountError,
    );
  });

  it("should reject negative amount on creation", () => {
    expect(() => Money.from({ amount: "-10.00", currency: "BRL" })).toThrow(
      NegativeMoneyError,
    );
  });

  it("should create zero money instance correctly with zero()", () => {
    const zeroMoney = Money.zero("BRL");
    expect(zeroMoney.amount).toBe("0.00");
    expect(zeroMoney.currency).toBe("BRL");
    expect(zeroMoney.isZero()).toBe(true);
  });

  it("should correctly identify zero and non-zero amounts with isZero()", () => {
    const zeroMoney = Money.zero("USD");
    const positiveMoney = Money.from({ amount: "10.00", currency: "USD" });

    expect(zeroMoney.isZero()).toBe(true);
    expect(positiveMoney.isZero()).toBe(false);
  });

  it("should add amounts with same currency", () => {
    const m1 = Money.from({ amount: "25.50", currency: "BRL" });
    const m2 = Money.from({ amount: "10.25", currency: "BRL" });
    const result = m1.add(m2);

    expect(result.amount).toBe("35.75");
  });

  it("should throw CurrencyMismatchError when adding different currencies", () => {
    const m1 = Money.from({ amount: "25.50", currency: "BRL" });
    const m2 = Money.from({ amount: "10.25", currency: "USD" });

    expect(() => m1.add(m2)).toThrow(CurrencyMismatchError);
  });

  it("should subtract amounts with same currency correctly", () => {
    const m1 = Money.from({ amount: "50.00", currency: "BRL" });
    const m2 = Money.from({ amount: "20.50", currency: "BRL" });
    const result = m1.subtract(m2);

    expect(result.amount).toBe("29.50");
  });

  it("should throw CurrencyMismatchError when subtracting different currencies", () => {
    const m1 = Money.from({ amount: "50.00", currency: "BRL" });
    const m2 = Money.from({ amount: "20.50", currency: "USD" });

    expect(() => m1.subtract(m2)).toThrow(CurrencyMismatchError);
  });

  it("should compare amounts correctly using isLessThan", () => {
    const m1 = Money.from({ amount: "10.00", currency: "BRL" });
    const m2 = Money.from({ amount: "20.00", currency: "BRL" });
    const m3 = Money.from({ amount: "10.00", currency: "BRL" });

    expect(m1.isLessThan(m2)).toBe(true);
    expect(m2.isLessThan(m1)).toBe(false);
    expect(m1.isLessThan(m3)).toBe(false);
  });

  it("should throw CurrencyMismatchError when comparing different currencies with isLessThan", () => {
    const m1 = Money.from({ amount: "10.00", currency: "BRL" });
    const m2 = Money.from({ amount: "20.00", currency: "USD" });

    expect(() => m1.isLessThan(m2)).toThrow(CurrencyMismatchError);
  });
});
