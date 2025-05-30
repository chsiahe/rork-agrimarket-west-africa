/**
 * Represents a single market trend submission by a user.
 */
export type MarketTrendSubmission = {
  /** Unique identifier for the submission (optional, assigned by backend) */
  readonly id?: string;
  /** The user who submitted the trend data */
  readonly userId: string;
  /** Product or commodity category (e.g., maize, rice) */
  readonly category: string;
  /** Name of the city where price was recorded */
  readonly city: string;
  /** Name of the region/state/province */
  readonly region: string;
  /** Name of the country */
  readonly country: string;
  /** Price value for the given commodity and location */
  readonly price: number;
  /** Unit of measurement for the price (consider using a Unit enum for stricter typing) */
  readonly unit: string;
  /** ISO timestamp string when the record was created (optional) */
  readonly createdAt?: string;
};

/**
 * Represents a single data point in a market trend aggregate.
 */
export type MarketTrendDataPoint = {
  /** Date for this data point (ISO string, e.g., '2024-01-20') */
  readonly date: string;
  /** Price recorded on this date */
  readonly price: number;
};

/**
 * Represents an aggregated view of market trends for a specific category and city.
 */
export type MarketTrendAggregate = {
  /** Product or commodity category */
  readonly category: string;
  /** City for which the aggregate is computed */
  readonly city: string;
  /** Average price for this category and city, based on submissions */
  readonly averagePrice: number;
  /** Unit of measurement for the average price */
  readonly unit: string;
  /** Collection of historical data points */
  readonly dataPoints: MarketTrendDataPoint[];
  /** Number of submissions aggregated */
  readonly submissions: number;
};

/**
 * (Optional) Enum for units, if your app uses a limited set of measurement units.
 */
// export enum Unit {
//   KG = 'kg',
//   TON = 'ton',
//   LITRE = 'litre',
//   PIECE = 'piece',
//   // Add more as needed
// }
