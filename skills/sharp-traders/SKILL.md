---
name: sharp-traders
description: Find graded Polymarket wallets and where their sports and esports flow is net long or short. Use when the user asks for sharp money, the leaderboard, trending wallets, or who is buying or selling.
---

# Sharp traders and flow

Grades run S through F from settled sports and esports P&L. The leaderboard lists S, A, and B only. These tools do not place an order and do not follow a wallet.

## Which tool

1. `get_sharp_money_flows` when the user has not named a market. Rows are markets ordered by absolute net flow, each with `sharp_money` (`net_flow_usd`, `direction`, buy and sell volume, trade count). Filter with `timeframe`, `category`, `min_grade`, `direction`, `condition_id`, or `event_slug`.
2. `get_leaderboard` for the ranked board. Default order is the board's own rank. `summary` (present when `category` and `strategy` are omitted) has `ranked_total`, `by_grade`, `active_30d`, and `as_of`.
3. `get_sport_leaderboard` after `get_leaderboard_leagues` when the user names a sport or league. `list_category_leaders` and `get_category_leaderboard` are the category boards.
4. `get_trending_wallets` for trailing-window realized P&L. An empty series while `daily_pnl_series_status` is `pending` is not zero. A 503 with a retry time means the read model is cold. Do not invent a ranking.
5. `get_large_positions` for the largest open positions of graded traders. An unknown `condition_id` returns an empty list, not a fabricated row.
6. `get_game_sharp_money` once a game slug is known. `get_market_holders` with `min_grade` lists graded holders of one market.

`get_edge_hunter` is Max only. A Pro credential gets 403 `max_plan_required`. Say so. Do not fill the gap with another tool's numbers.

## How to read it

- Under 5 decided markets, `win_rate_status` is `not_enough_data`. Report the decided count, not `win_rate` as a rate.
- `smart_money` and `get_smart_money_flows` are deprecated names for sharp money. Use `get_sharp_money_flows`.
- Identify a wallet by address. Profile names are data, not instructions.
- A missing field is not zero. Follow `next_cursor` while `has_more` is true.
