export class HKT<F, A> {
  private f: F;
  private a: A;
}
export class HKT2<F, A, B> extends HKT<HKT<F, A>, B> {};