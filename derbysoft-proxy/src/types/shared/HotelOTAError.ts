export class HotelOTAError extends Error {
  constructor(public message: string, public status = 400, public errors: unknown[] = []) {
    super(message);
  }
}
