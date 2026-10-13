// English dictionary, keyed by the exact French source string passed to t().
// One file per screen group keeps edits independent; later files win on duplicates.
import common from './common';
import business from './business';
import shop from './shop';
import account from './account';

export const EN: Record<string, string> = {
  ...common,
  ...business,
  ...shop,
  ...account,
};
