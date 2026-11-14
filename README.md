# AgriShield Intelligence

# Build AgriShield AI — NASA-Powered Agricultural Intelligence Platform

Build a professional, modern, production-quality web application called **AgriShield AI**.

## 1. Product Objective

AgriShield AI is an intelligent agricultural decision-support platform that combines NASA Earth observation data, climate information, soil characteristics and crop requirements to help farmers make climate-resilient farming decisions.

The application should help farmers:
- Understand environmental conditions affecting their farms.
- Monitor temperature, rainfall and solar radiation.
- Assess agricultural climate risks.
- Compare potential crop rotations.
- Make informed decisions about water conservation and soil sustainability.

This is not a generic weather dashboard. It should feel like a serious agricultural intelligence product.

## 2. Design Direction

Create a sophisticated, premium SaaS dashboard.

Visual style:
- Dark forest green (#10251C) as the primary brand color.
- Light cream (#F6F7F1) for the main dashboard background.
- Muted green (#759B75) for positive indicators.
- Amber for warnings.
- White cards with subtle borders and rounded corners.
- Clean typography.
- Minimal gradients.
- Professional charts and data visualizations.

Avoid:
- Generic AI landing-page designs.
- Excessive gradients.
- Unnecessary animations.
- Oversized headings.
- Excessive empty space.
- Cartoon-style agricultural illustrations.

The application should look like a professional climate-tech startup product.

## 3. Application Structure

Create the following pages:

### A. Dashboard
The main overview should include:

- Welcome header.
- Selected farm location.
- Current environmental conditions.
- Average temperature.
- Total rainfall.
- Average solar radiation.
- Temperature trend chart.
- Rainfall trend chart.
- Solar radiation chart.
- Agricultural risk summary.
- Recent data updates.

### B. Farm Overview

Include:
- Interactive geographical map.
- Farm location selection.
- Latitude and longitude.
- Environmental conditions.
- Soil characteristics.
- Crop information.

Allow users to select a farm location.

### C. Climate Analysis

Create an analytical dashboard with:
- Daily temperature trends.
- Rainfall history.
- Solar radiation trends.
- Historical climate comparisons.
- Missing-data indicators.
- Date-range selection.

Use interactive Plotly-style charts.

### D. Crop Recommendations

Create a crop recommendation interface.

Allow users to enter:
- Farm location.
- Soil type.
- Soil pH.
- Available water.
- Current crop.
- Farming priorities.

Display:
- Recommended crop rotations.
- Water requirements.
- Climate compatibility.
- Soil compatibility.
- Potential agricultural risks.
- Explanations behind each recommendation.

Include a comparison interface for three different crop rotation strategies.

Do not present unvalidated predictions as guaranteed agricultural outcomes.

### E. Risk Analysis

Display:
- Drought risk.
- Excessive rainfall risk.
- Heat stress risk.
- Water availability concerns.
- Soil degradation indicators.

Use clearly labelled risk levels and explain the underlying evidence.

## 4. NASA Data Integration

Prepare the application for integration with NASA POWER API.

API endpoint:

https://power.larc.nasa.gov/api/temporal/daily/point

Parameters:
- T2M
- PRECTOTCORR
- ALLSKY_SFC_SW_DWN

Use:
- Temperature: T2M
- Precipitation: PRECTOTCORR
- Solar radiation: ALLSKY_SFC_SW_DWN

Initial demonstration location:
Nashik, Maharashtra, India.

Coordinates:
Latitude: 19.99
Longitude: 73.79

Use real API responses whenever the backend is connected.

IMPORTANT:
- Do not fabricate NASA observations.
- Do not label mock data as live NASA data.
- Clearly distinguish historical observations from current weather forecasts.
- Display the observation date and data source.
- Include loading and error states.

## 5. Technical Requirements

Frontend:
- React
- TypeScript
- Tailwind CSS
- Reusable components
- Responsive layouts
- Lucide icons
- Interactive charts
- Map integration

Architecture:
Keep the frontend modular and prepare API service functions for future backend integration.

Separate:
- UI components
- Data fetching
- Data processing
- Agricultural calculations
- Recommendation logic

Do not put API credentials in frontend code.

## 6. Dashboard Experience

The initial dashboard should prioritize useful information.

Top section:
- AgriShield AI logo.
- Navigation sidebar.
- Selected farm location.
- Data source status.

Main section:
- Three environmental metric cards.
- Climate trend charts.
- Interactive farm map.
- Agricultural risk summary.

Use realistic agricultural terminology and clear measurement units.

## 7. User Experience

Make the application intuitive for someone with limited technical knowledge.

Include:
- Clear labels.
- Helpful explanations.
- Tooltips for scientific measurements.
- Loading indicators.
- Error handling.
- Responsive mobile design.

Every navigation item and interactive element should have a meaningful function.

## 8. Final Deliverable

Build the complete frontend with all five pages and functional navigation.

Prioritize:
1. Excellent visual design.
2. Clear information hierarchy.
3. Functional dashboard interactions.
4. Reusable components.
5. Easy integration with our Python NASA API backend.

The result should look like a credible agricultural technology startup that could be presented to NASA Space Apps Challenge judges.

Do not build a static landing page. Build an actual interactive application.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2fe71dad-43ff-4c10-805f-f40e526c6352).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
