declare module 'lunar-javascript' {
  export class Solar {
    constructor(year: number, month: number, day: number);
    static fromYmd(year: number, month: number, day: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
    toString(): string;
    toFullString(): string;
  }

  export class Lunar {
    constructor(year: number, month: number, day: number);
    static fromYmd(year: number, month: number, day: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
    toString(): string;
    toFullString(): string;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getJieQi(): string;
  }
}
