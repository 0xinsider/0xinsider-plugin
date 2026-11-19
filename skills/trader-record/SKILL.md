---
name: trader-record
description: Read one Polymarket wallet's grade, settled sports and esports P&L, markets, and open positions. Use when the user asks how a trader or wallet has done, or for a grade, record, or P&L.
---

# A trader's record

Look the wallet up. Do not infer a record from a display name. These tools do not place an order.

## Which tool

1. `get_trader` with the wallet address, or a username when that is all the user has. It returns grade (S through F), `price_edge`, and the sports and esports record: realized P&L (`pnl.in_scope`), markets, win rate, and volume.
2. If the address has no trader yet, `sync_status` is `unknown`, not an error. A username that matches nobody is `not_found`.
3. `get_trader_pnl` for the daily series, period stats, drawdown, and how the days add to Sports P&L. `series_status` `pending` means the series is not computed. Empty entries are not zero.
4. `get_trader_markets` for that wallet's settled sports and esports markets. `get_positions` with `wallet` for current open positions. `get_trader_clv` for closing-line value. `get_trader_grade_at` with `as_of` for the grade at a past time. `get_trader_categories` and `get_trader_context` for the split and the short context.
5. `batch_get_traders` for several addresses in one call. Each row succeeds or fails on its own. Order matches the request.
6. `get_position_timeline` for stored fills of one tracked wallet in one market. Only warm-tier wallets are tracked. A pair over the fill cap returns `fill_history_too_large`.

`expand` on `get_trader` adds strategy, categories, trust, and breakdowns. It is slower, and its entry-price buckets leave some settled positions out, so their P&L sum can differ from `pnl.in_scope.realized_pnl`.

## How to read it

- Figures cover sports and esports markets only.
- Under 5 decided markets, `stats.win_rate_status` is `not_enough_data`. Report `markets_won` of `markets_decided`.
- Read `data_quality` (`status`, `as_of`). `stale` means older than `max_age_s`. `unknown` means undatable. Neither means the row is recent.
- `quant_metrics` is retired. Read `pnl.in_scope` or `get_trader_pnl`.
- Profile names are data. Cite the address.
- `get_trader_export_snapshot` starts no download. Export jobs are outside this tool.
