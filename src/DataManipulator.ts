import { ServerRespond } from './DataStreamer';

export interface Row {
  price_abc: number,
  price_def: number,
  ratio: number,
  timestamp: Date,
  upper_bound: number,
  lower_bound: number,
  trigger_alert: number | undefined,
}


export class DataManipulator {
  avg: number;
  count: number;
  ratios: Array<number>;
  
  constructor() {
    this.avg = 0;
    this.count = 0;
    this.ratios = [];
  }

  getBounds(ratio: number) {
    // confidence_level is 0.95;
    const confidence_coefficient = 1.96;
    const rangePercent = 0.05;

    this.avg = (this.avg * this.count + ratio) / (this.count+1);
    this.count = this.count + 1;
    this.ratios.push(ratio);

    let stand_dev = 0;
    for (let i = 0; i < this.count; i++) {
      stand_dev += Math.pow(this.ratios[i] - this.avg,2);
    }
    stand_dev = stand_dev / this.count;

    const diffrance = confidence_coefficient * stand_dev / (Math.sqrt(this.count));

    const lower_bound = (this.avg - diffrance) * (1-rangePercent);
    const upper_bound = (this.avg + diffrance) * (1+rangePercent);
    return {
      lowerBound: lower_bound,
      upperBound: upper_bound,
    }
  }

  generateRow(serverRespond: ServerRespond[]) : Row {
    const priceABC = (serverRespond[0].top_ask.price + serverRespond[0].top_bid.price) / 2;
    const priceDEF = (serverRespond[1].top_ask.price + serverRespond[0].top_bid.price) / 2;
    const ratio = priceABC/priceDEF;
    //TODO calclate the real upper and lower monds
    const bounds = this.getBounds(ratio);
    const lowerBound = bounds.lowerBound;
    const upperBound = bounds.upperBound;

    console.log(lowerBound);
    console.log(upperBound);

    return  {
      price_abc:priceABC,
      price_def:priceDEF,
      ratio,
      timestamp: serverRespond[0].timestamp > serverRespond[1].timestamp ?
        serverRespond[0].timestamp : serverRespond[1].timestamp,
      upper_bound: upperBound,
      lower_bound: lowerBound,
      trigger_alert: (ratio > upperBound || ratio < lowerBound) ? ratio : undefined,
    };
  }
}
