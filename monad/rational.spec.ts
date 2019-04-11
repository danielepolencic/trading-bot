import * as test from 'tape';
import * as ℚ from '../monad/rational';

test('it should parse a number', assert => {
  assert.plan(5);

  assert.equal(ℚ.parse(1.001), '+1001/1000');
  assert.equal(ℚ.parse(-4), '-4/1');
  assert.equal(ℚ.parse('-4.92'), '-492/100');
  assert.equal(ℚ.parse('3944.00'), '+394400/100');
  assert.equal(ℚ.parse('0.0001'), '+1/10000');
});

test('it should add two fractions', assert => {
  assert.plan(1);

  const fraction = ℚ.addTo(ℚ.parse(0.2))((ℚ.parse(0.2)));
  assert.equal(ℚ.toFloat(fraction), 0.4);
});

test('it should multiply two fractions', assert => {
  assert.plan(1);

  const fraction = ℚ.multiplyBy(ℚ.parse(0.2))((ℚ.parse(0.2)));
  assert.equal(ℚ.toFloat(fraction), 0.04);
});

test('it should divide two fractions', assert => {
  assert.plan(1);

  const fraction = ℚ.divideBy(ℚ.parse(0.2))((ℚ.parse(0.2)));
  assert.equal(ℚ.toFloat(fraction), 1);
});

test('it should subtract two fractions', assert => {
  assert.plan(1);

  const fraction = ℚ.subtractTo(ℚ.parse(0.2))((ℚ.parse(0.2)));
  assert.equal(ℚ.toFloat(fraction), 0);
});

test('it should invert a fraction', assert => {
  assert.plan(1);

  const fraction = ℚ.inverse(ℚ.parse(0.2));
  assert.equal(ℚ.toFloat(fraction), 5);
});