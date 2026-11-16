# Missing Points

This document lists what the application is missing, measured against its main objective in [`docs/objective.md`](../objective.md).

The application shows what happened, but it does not yet help decide what to do. The biggest gap is the lack of recommendations. The most urgent problem is that crime data is available without login.

These findings come from reading the code and searching for features. No live requests were run.

## Security: Fix First

- **No login required for crime data**: 34 routes use `jwt_required(optional=True)`, and `/data` in `app.py` lists all crimes with no authentication. `/api/crimes` and `/api/export` are open to anyone, and the export includes addresses and descriptions.
- **Unit restriction never applies**: `apply_user_unidade_filter` checks `'user_id' in jwt_identity`, but login sets the identity to `str(user.id)`. The check always fails, so logged-in users see all units.
- **Chat ignores units**: The chat code has no unit filter.
- **Password reset does nothing**: `/auth/forgot-password` says a link was sent, but it sends no email.
- **Weak defaults**: The default admin password is `admin123`, and `ProductionConfig` sets `DEBUG = True`.

## Decision Support: Core Gaps

- **No patrol recommendations**: Nothing ranks where and when to deploy. Patrol terms appear only in AI knowledge text and template responses.
- **No operational data**: The data model has no vehicles, staffing, shifts, or patrol routes, so the application cannot compare resources with demand.
- **No alerts**: Nothing flags a spike or a new hotspot, so users must spot changes themselves.
- **No way to measure results**: Nothing checks whether an operation reduced crime in an area.
- **No command reports**: No PDF or scheduled report feature was found.

## Analysis Gaps

- **Weak forecasting**: The forecast uses a moving average and a linear trend on monthly counts. It has no location forecast or accuracy check.
- **Demographics missing from the UI**: IBGE and correlation endpoints exist, but the web and mobile apps never call them. As a result, crime rates per 1,000 people never reach users, and raw counts can mislead when comparing cities.

## Data Gaps

- **Manual loading only**: Data arrives by CSV upload, with no scheduled import. `cenop.md` names SIGESPOL as the official system, but no integration was found.
- **Excel uploads fail**: `.xlsx` and `.xls` files pass validation, but the file is read only as CSV.
- **Incomplete mapping**: Rows pending georeferencing have no real location, and the importer cannot geocode them. `cenop.md` also lists the georeferencing of villages (povoados) as an open problem.

## AI Chat Gaps

- **Poor answers in Docker**: MLX is not installed in the images, so the chat falls back to `gpt2`.
- **Hidden fallback**: When generation fails, a template response is returned like a normal answer. Users may read it as analysis of real data.
- **Embeddings service missing**: Ollama is not part of Docker Compose.

## Priority Order

1. Require login on all data routes, and fix the unit filter, including in the chat.
2. Add a ranked list of area and time-of-day priorities for each unit.
3. Add spike and hotspot alerts.
4. Show crime rates per 1,000 people in the UI.
5. Add automated data import, starting with SIGESPOL.
