---
name: pick-record
description: Read the published Pick of the Day slate and its track record. Use when the user asks for today's picks, a past day's slate, the hit rate, or the proof. This is a published record, not an order.
---

# Pick of the Day

The slate is the algorithm's published record. Do not invent a pick, and do not describe one as an order.

## Which tool

1. `get_pick_of_the_day` for a day (`date`) or one `pick_id`. Read picks in `publication_order`. Pro opens five selections. Max opens all, up to twenty-five. `locked_picks` are slots the plan does not open. `scheduled_picks` are entitled slots not released yet. `proof_pending_picks` are published picks whose holder proof is not readable yet.
2. Today with no pick yet returns `pick_not_released` and `retry_at`. Read again at that time. Do not poll before it. A past day with no pick is `not_found`. `more_picks_until` means another pick can still be added. It does not promise one.
3. Use `view=summary` unless the user needs the long form. `view=full` without `pick_id` can pass 200,000 characters.
4. `get_pick_of_the_day_archive` for the track record, newest first, plus `hit_rate` (wins over decided; void and pending excluded) and the flat-$1,000-stake profit and ROI. Default `view=summary`. Pass `page.next_cursor` as `cursor` for older rows.
5. `get_pick_of_the_day_stats` for the breakdown of that same published record. Default `view=summary`. Name a growing section in `sections` when the user asks for it.
6. `get_pick_of_the_day_ledger_entry` for one pick's sealed, opened, or uncommitted proof. Pending proofs withhold the backed side and nonce. Do not guess a proof format from the date.
7. `get_pick_of_the_day_wallet_markets` only for a wallet already on that pick's `display_holders`, and only for a pick the credential can open. Anything else is `not_found`.

## How to read it

- Withdrawn picks are omitted from rows and from aggregates.
- A row outside the plan keeps slot, date, outcome, and `required_tier`, with `backed_side_locked` true. Do not infer the side.
- If the user asks whether a pick authorizes an automated entry, require a present, unexpired `entry_authorization` and report its `max_entry_price` and `expires_at`. A pick released without one never gains one. Reporting that field is not placing an order.
- Holder counts on a pick (`holder_count`, `top_grade`) count S and A wallets only. `backed_side_share` and `sharp_positioned_usd` include every listed grade.
