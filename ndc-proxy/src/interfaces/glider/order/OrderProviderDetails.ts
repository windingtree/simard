export class OrderProviderDetails {
  public orderID: string;
  public owner: string;

  constructor(orderID?: string, owner?: string) {
    this.orderID = orderID;
    this.owner = owner;
  }
}
