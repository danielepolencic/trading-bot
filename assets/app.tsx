import * as React from 'react';
import * as V from 'victory';
import * as d3 from 'd3-array';

const Tooltip = (V as any).VictoryTooltip;
const Group = (V as any).VictoryGroup;

function ticksAround(series1: any[], series2: any[]): [number, number, number] {
  const ys = series1.map(item => 1/item.rate).concat(series2.map(item => item.rate));
  const avg = d3.mean(ys) || 0;
  return [avg * (1 - 0.005), avg, avg * (1 + 0.005)];
}

export function App(props: any) {
  if (!props) return <div>Please wait</div>
  return <div>
      <div className="container">

      <InfoChart
        currencyFairDirectQuote={props.state['CurrencyFairQuotes:GBP:EUR']}
        currencyFairIndirectQuote={props.state['CurrencyFairQuotes:EUR:GBP']}
        oandaPrice={props.state['OandaQuotes:GBP:EUR']}
        currencyBuy="GBP"
        currencySell="EUR"
      />

      <InfoChart
        currencyFairDirectQuote={props.state['CurrencyFairQuotes:USD:GBP']}
        currencyFairIndirectQuote={props.state['CurrencyFairQuotes:GBP:USD']}
        oandaPrice={props.state['OandaQuotes:USD:GBP']}
        currencyBuy="USD"
        currencySell="GBP"
      />

      <InfoChart
        currencyFairDirectQuote={props.state['CurrencyFairQuotes:USD:EUR']}
        currencyFairIndirectQuote={props.state['CurrencyFairQuotes:EUR:USD']}
        oandaPrice={props.state['OandaQuotes:USD:EUR']}
        currencyBuy="USD"
        currencySell="EUR"
      />

    </div>
    <pre>{JSON.stringify(anonymise(props.state.state), null, 2)}</pre>
  </div>;
}

function anonymise(state: any): any {
  if (isObject(state)) {
    Object.keys(state).forEach(key => {
      switch(key) {
        case 'profiles':
          Object.keys(state[key]).forEach(id => {
            state[key][id] = state[key][id].username
          });
          break;
        case 'profile':
          state[key] = state[key].username;
          break;
        default:
          state[key] = anonymise(state[key]);
      }
    });
    return state;
  }

  if (Array.isArray(state)) {
    return state.map(anonymise);
  }

  return state;
}

function isObject(value: any): boolean {
  return ({}).toString.call(value) === '[object Object]';
}

interface IInfoChart {
  currencyFairDirectQuote: IDatum[]
  currencyFairIndirectQuote: IDatum[]
  oandaPrice: IDatum[]
  currencyBuy: string
  currencySell: string
}

function InfoChart(props: IInfoChart) {
  return  <div className="chart">
    <Header
      spread={props.currencyFairIndirectQuote.slice(-1)[0].rate * props.currencyFairDirectQuote.slice(-1)[0].rate}
      spreadDirect={props.currencyFairDirectQuote.slice(-1)[0].rate * (1 / props.oandaPrice.slice(-1)[0].rate)}
      spreadIndirect={props.currencyFairIndirectQuote.slice(-1)[0].rate * props.oandaPrice.slice(-1)[0].rate}
      currencyBuy={props.currencyBuy}
      currencySell={props.currencySell}
      directQuote={props.currencyFairDirectQuote.slice(-1)[0].rate}
      indirectQuote={props.currencyFairIndirectQuote.slice(-1)[0].rate}
      price={props.oandaPrice.slice(-1)[0].rate}
    />

    <Autocorrelation
      series1={props.currencyFairIndirectQuote}
      series2={props.currencyFairDirectQuote}
      series3={props.oandaPrice}
      yTicks={ticksAround(
        props.currencyFairIndirectQuote,
        props.currencyFairDirectQuote
      )}
      currencyBuy={props.currencyBuy}
      currencySell={props.currencySell}
    />
  </div>
}

interface IDatum {
  label: boolean
  rate: number
  time: number
}

interface IAutocorrelation {
  yTicks: [number, number, number]
  series1: IDatum[]
  series2: IDatum[]
  series3: IDatum[]
  currencyBuy: string
  currencySell: string
}

export function Autocorrelation(props: IAutocorrelation) {
  return <V.VictoryChart>
    <Group
      domain={{y: [props.yTicks[0], props.yTicks[props.yTicks.length -1 ]]}}
      data={Array.isArray(props.series1) ? props.series1 : []}
      x="time"
      y={(d: IDatum) => 1 / d.rate}
    >
      <V.VictoryLine
        style={{data: {stroke: '#F57F29'}}}
      />
      <V.VictoryScatter
        style={{data: {fill: '#c2641f'}}}
        labelComponent={<Tooltip text={(d: IDatum) => `${props.currencySell}/${props.currencyBuy} ${(d.rate)}`}/>}
      />
    </Group>
    <Group
      domain={{y: [props.yTicks[0], props.yTicks[props.yTicks.length -1 ]]}}
      data={Array.isArray(props.series2) ? props.series2 : []}
      x="time"
      y="rate"
    >
      <V.VictoryLine
        style={{data: {stroke: '#00A9E0'}}}
      />
      <V.VictoryScatter
        style={{data: {fill: '#037ca3'}}}
        labelComponent={<Tooltip text={(d: IDatum) => `${props.currencyBuy}/${props.currencySell} ${d.rate}`}/>}
      />
    </Group>
    <Group
      domain={{y: [props.yTicks[0], props.yTicks[props.yTicks.length -1 ]]}}
      data={Array.isArray(props.series3) ? props.series3 : []}
      x="time"
      y="rate"
    >
      <V.VictoryLine
        style={{data: {stroke: '#97D700'}}}
      />
      <V.VictoryScatter
        style={{data: {fill: '#5f8603'}}}
        labelComponent={<Tooltip text={(d: IDatum) => `${props.currencyBuy}/${props.currencySell} ${d.rate}`}/>}
      />
    </Group>
    <V.VictoryAxis dependentAxis tickValues={props.yTicks} tickFormat={(tick) => rounder(tick, 4)}/>
    <V.VictoryAxis tickFormat={(tick) => new Date(tick).toISOString().substring(11, 16)}/>
  </V.VictoryChart>;
}

interface ISeries {
  spread: number
  spreadDirect: number
  spreadIndirect: number
  currencyBuy: string
  currencySell: string
  directQuote: number
  indirectQuote: number
  price: number
}

function Header(series: ISeries) {
  return <div className="container">
    <div className="block2">
      <div className="container">
        <div className="block2 direct">
          <h2>{rounder(series.directQuote, 4)}</h2>
          <h3>Buy {series.currencyBuy} / Sell {series.currencySell}</h3>
        </div>
        <div className="block2 indirect">
          <h2>{rounder(series.indirectQuote, 4)}</h2>
          <h3>Buy {series.currencySell} / Sell {series.currencyBuy}</h3>
        </div>
      </div>
      <div className="container">
        <div className={'block2 spread' + (series.spreadDirect > 1 ? ' active' : '')}>
          <h2>{rounder(series.spreadDirect, 4)}</h2>
          <h3>Spread {series.currencySell}</h3>
        </div>
        <div className={'block2 spread' + (series.spreadIndirect > 1 ? ' active' : '')}>
          <h2>{rounder(series.spreadIndirect, 4)}</h2>
          <h3>Spread {series.currencyBuy}</h3>
        </div>
      </div>
    </div>
    <div className="block2">
      <div className="container">
        <div className={'block spread' + (series.spread > 1 ? ' active' : '')}>
          <h2>{rounder(series.spread, 4)}</h2>
          <h3>Spread CurrencyFair</h3>
        </div>
      </div>
      <div className="container">
        <div className="block oanda">
          <h2>{rounder(series.price, 5)}</h2>
          <h3>Buy {series.currencyBuy} / Sell {series.currencySell}</h3>
        </div>
      </div>
    </div>
  </div>;
}

function rounder(value: number, decimals: number): number {
  return Number(`${Math.round(`${value}e${decimals}` as any)}e-${decimals}`);
}