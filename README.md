# AgriShield Intelligence

AgriShield Intelligence is an agricultural decision-support dashboard that turns satellite-derived climate observations into practical context for a farm. Farmers can explore recent conditions, assess rule-based climate risks, compare crop rotations, and view NASA imagery for a selected location.

The app is designed to make environmental data easier to understand and use. It supports informed decisions about water, crops, and field monitoring; it does not guarantee yields or replace local agricultural expertise.

## Why it matters

Climate and Earth-observation data can be difficult to interpret at the farm level. AgriShield brings those observations together with a farmer's location, soil, water availability, and crop information to help users:

- See temperature, rainfall, and solar-radiation trends for a chosen location.
- Identify recent conditions worth investigating, such as a dry spell, unusually heavy rainfall, or heat stress.
- Compare crop and rotation options against climate observations and farm-specific inputs.
- Inspect NASA satellite imagery alongside the farm location.
- Understand where information came from, what dates it covers, and when values are missing.

The intended value is better awareness and more transparent planning, not automated or guaranteed farming advice. The app does not currently measure changes in yield, income, or water use.

## Features

### Dashboard

- [Screenshot: Dashboard showing climate metric cards, trend charts, recent-observation alerts, and agricultural risk summary.]

- Summary cards for mean temperature, total rainfall, and mean solar radiation.
- Daily climate charts and a recent-observation alert center.
- Rule-based agricultural risk summary for the selected farm.
- Current farm location, latest observation date, data retrieval time, and source.

### Farm Overview

- [Screenshot: Farm Overview showing the selected farm, editable profile, and a NASA GIBS imagery layer on the map.]

- Select a location by clicking the map, entering coordinates, or choosing a preset region.
- Edit farm details such as soil type, pH, organic carbon, area, crop, irrigation method, and water availability.
- View a 90-day environmental summary.
- Toggle NASA GIBS imagery layers, including NDVI, soil-moisture imagery, and true color.

### Climate Analysis

- [Screenshot: Climate Analysis showing date-range controls, year-over-year comparison, charts, and missing-data indicators.]

- Explore daily temperature, precipitation, and solar-radiation observations.
- Choose a date range or a 30-, 90-, 180-, or 365-day preset.
- Compare the selected period with the previous year.
- Inspect missing-data indicators; missing values are shown as gaps and excluded from summaries.

### Crop Recommendations

- [Screenshot: Crop Recommendations showing rotation comparisons, suitability explanations, and the yield-screening inputs with its caution.]

- Compare crop rotations using recent climate data and the saved farm profile.
- Adjust soil, pH, water availability, current crop, and farming priorities.
- Review climate, soil, and water suitability scores with explanatory factors.
- Optionally calculate an experimental yield-screening estimate using user-supplied crop parameters.

The yield screen is not a validated yield model or full-season forecast. It requires complete observed inputs and crop-specific parameters supplied by the user. Treat it as exploratory only.

### Risk Analysis

- [Screenshot: Risk Analysis showing the risk levels, supporting evidence, and suggested actions.]

- Review drought, excess-rainfall, heat, water-availability, and soil risk indicators.
- See the evidence and suggested action behind each rule-based score.
- Use the indicators to guide further field checks, not as official warnings or forecasts.

## Data sources and limitations

### NASA POWER

When no Python backend is configured, climate data is fetched server-side from the NASA POWER daily point endpoint:

`https://power.larc.nasa.gov/api/temporal/daily/point`

The application requests:

| NASA POWER parameter | Use in the app |
| --- | --- |
| `T2M` | Daily mean temperature |
| `T2M_MAX`, `T2M_MIN` | Daily temperature range for the experimental yield screen |
| `RH2M` | Relative humidity for the experimental yield screen |
| `PRECTOTCORR` | Daily precipitation |
| `ALLSKY_SFC_SW_DWN` | Daily all-sky surface solar radiation |

The default view covers approximately the latest 90 available days and ends seven days before the current date to account for typical data latency. NASA POWER values are historical observations, not live weather forecasts. The app displays the source and observation period.

NASA POWER uses missing-value sentinels. Missing observations are represented as `null`; the app must not replace them with fabricated values. Some indicators may be unavailable when the required observations are missing.

### NASA GIBS and basemap

NASA GIBS provides the optional satellite imagery overlays on the Farm Overview map. Tile availability varies by layer and date. The map uses OpenStreetMap for its base layer; both sources are attributed in the UI.

### Optional Python backend

Set `AGRISHIELD_API_URL` in the server environment to use a Python climate backend instead of calling NASA POWER directly. The backend is expected to expose `GET /climate` and return the `ClimateSeries` shape defined in `src/lib/nasa/types.ts`. Keep credentials and server-only configuration out of browser code.

## Technology and architecture

- **Frontend:** React, TypeScript, Tailwind CSS, and reusable UI components.
- **Routing and server rendering:** TanStack Start and file-based TanStack Router.
- **Data fetching:** TanStack Query.
- **Charts and maps:** Recharts and Leaflet.
- **Server build:** Vite with Nitro, targeting the Cloudflare module preset by default.

Key source directories:

```text
src/
  routes/             Dashboard and feature pages
  components/app/     Application-specific UI
  components/ui/      Reusable UI primitives
  lib/agri/           Climate statistics, risk, recommendations, and screening logic
  lib/nasa/           NASA data types, queries, server fetching, and GIBS layers
  test/               Vitest tests
```

Farm profile state is shared through `src/lib/farm-context.tsx` and persisted in browser local storage. NASA POWER fetching is handled by the server function in `src/lib/nasa/power.functions.ts`. Agricultural calculations belong in `src/lib/agri/`; route components should orchestrate data and rendering rather than duplicate domain rules. `src/routeTree.gen.ts` is generated by TanStack Router and should not be edited manually.

## Getting started

Requirements: Node.js 22.12 or newer and Bun.

```sh
git clone <repository-url>
cd agrishield-intelligence
bun install
bun run dev
```

The development server uses port `8080` by default. Open `http://localhost:8080`.

To use the Python backend, set `AGRISHIELD_API_URL` in the server environment before starting the app. No NASA API key is required for the public NASA POWER endpoint.

## Validation and production build

```sh
bun run test
npx tsc --noEmit
bun run build
```

The production build is generated through Vite and Nitro. `bun.lock` is the project dependency lockfile; update it with Bun when changing dependencies.
