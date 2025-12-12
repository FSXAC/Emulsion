# Statistics Page Plan

## Overview
Create a dedicated statistics page for tracking film photography metrics, costs, and patterns. This page will provide insights into spending, shooting habits, and film stock preferences.

## Layout Design: Tabbed Interface

```
┌──────────────────────────────────────────────────┐
│ Statistics          [Overview] [Costs] [Gallery] │
├──────────────────────────────────────────────────┤
│                                                   │
│  [Overview Tab Active]                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ $XXX │ │ XXXX │ │  XXX │ │$X.XX │           │
│  │Total │ │Shots │ │Rolls │ │/Shot │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                   │
│  [Status Distribution Chart]                     │
│  [Format Distribution Chart]                     │
│  [Top Film Stocks Chart]                         │
│  [Rating Distribution Chart]                     │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Tab Structure

### 1. Overview Tab (Phases 14.1-14.4)
**Core Metrics:**
- Total spending (film + dev costs, excluding film cost for not_mine rolls)
- Total shots taken (actual_exposures with expected_exposures fallback)
- Total rolls count
- Average cost per shot

**Visualizations:**
- Status distribution chart (NEW, LOADED, EXPOSED, DEVELOPED, SCANNED)
- Format distribution chart (35mm, 120, etc.)
- Top 10 film stocks by usage
- Rating distribution (1-5 stars)

### 2. Costs Tab (Phase 14.6)
**Analysis:**
- Cost breakdown (film vs development)
- Chemistry usage by batch (pie chart)
- Cost per roll for each chemistry batch
- Most expensive roll
- Cheapest cost per shot

### 3. Gallery Tab (Phase 14.8 - Future)
**Features:**
- Grid of film stock thumbnails (reuse existing images from FilmRollCard)
- Filter by format, status, rating
- Click to view roll details (open EditRollForm)
- Sorting options

## Technical Approach

### Backend Changes: **NONE REQUIRED** ✅
- Leverage existing `GET /api/rolls` and `GET /api/chemistry` endpoints
- All statistics computed on frontend (acceptable for single-user app with hundreds of rolls)
- Future optimization: Add `GET /api/stats` if dataset grows significantly

### Frontend Changes

**New Dependencies:**
- `recharts` - React charting library for visualizations

**New Files:**
```
frontend/src/pages/StatsPage.jsx
frontend/src/components/StatCard.jsx
frontend/src/utils/statsCalculator.js
```

**Modified Files:**
```
frontend/src/App.jsx (add /stats route)
frontend/src/components/Layout.jsx (add Stats navigation link)
frontend/package.json (add recharts)
```

## Implementation Phases

### **HIGH PRIORITY**

#### Phase 14.1: Page Setup & Navigation ⭐
- [X] 14.1.1 Install Recharts (`npm install recharts`)
- [X] 14.1.2 Create `StatsPage.jsx` with tab interface skeleton
- [X] 14.1.3 Create `StatCard.jsx` component for metric cards
- [X] 14.1.4 Add `/stats` route to `App.jsx`
- [X] 14.1.5 Add "Stats" link in `Layout.jsx` navigation
- [X] 14.1.6 Test navigation and tab switching

#### Phase 14.2: Core Metrics (Overview Tab) ⭐
- [X] 14.2.1 Create `statsCalculator.js` utility
- [X] 14.2.2 Fetch all rolls and chemistry in StatsPage
- [X] 14.2.3 Calculate total spending (handle not_mine correctly)
- [X] 14.2.4 Calculate total shots (actual_exposures || expected_exposures)
- [X] 14.2.5 Calculate total rolls count
- [X] 14.2.6 Calculate average cost per shot
- [X] 14.2.7 Display 4 metric cards in grid
- [X] 14.2.8 Add loading and error states

#### Phase 14.3: Status & Format Charts (Overview Tab) ⭐
- [X] 14.3.1 Calculate rolls by status distribution
- [X] 14.3.2 Calculate rolls by format distribution
- [X] 14.3.3 Create bar chart for status (Recharts BarChart)
- [X] 14.3.4 Create bar chart for format
- [X] 14.3.5 Style charts with Tailwind colors (film-cyan, etc.)
- [X] 14.3.6 Make charts responsive

#### Phase 14.4: Film Stock & Rating Charts (Overview Tab) ⭐
- [X] 14.4.1 Calculate top 10 film stocks by usage count
- [X] 14.4.2 Calculate rating distribution (1-5 stars)
- [X] 14.4.3 Create bar chart for top film stocks
- [X] 14.4.4 Create bar chart for rating distribution
- [X] 14.4.5 Add "No ratings yet" empty state

#### Phase 14.6: Cost Analysis (Costs Tab) ⭐
- [X] 14.6.1 Create Costs tab component
- [X] 14.6.2 Calculate film cost vs dev cost breakdown
- [X] 14.6.3 Calculate chemistry usage by batch
- [X] 14.6.4 Create pie chart for cost breakdown
- [X] 14.6.5 Create pie chart for chemistry usage
- [X] 14.6.6 Show cost-per-roll for each chemistry batch
- [X] 14.6.7 Add "Most expensive roll" and "Cheapest per shot" cards

#### Phase 14.7: Polish & Responsive Design ⭐
- [X] 14.7.1 Ensure all charts responsive (mobile/tablet/desktop)
- [X] 14.7.2 Add empty states ("No data yet" messages)
- [X] 14.7.3 Add chart tooltips (hover for details)
- [X] 14.7.4 Test dark mode for all charts/cards
- [X] 14.7.5 Add smooth transitions between tabs
- [X] 14.7.6 Test with small and large datasets

### **LOW PRIORITY (Future)**

#### Phase 14.5: Timeline Visualizations
- [ ] 14.5.1 Calculate load/unload dates by month
- [ ] 14.5.2 Create timeline histogram (rolls loaded per month)
- [ ] 14.5.3 Create duration distribution (days in camera)
- [ ] 14.5.4 Add to Overview or separate Timeline tab

#### Phase 14.8: Gallery Tab
- [ ] 14.8.1 Create Gallery tab component
- [ ] 14.8.2 Display grid of rolls with (unique) film stock thumbnails
- [ ] 14.8.3 Refine the UI and visual for the gallery so clean and pleasing it's like an Apple store product page

#### Phase 14.9: Date Range Filters
- [ ] 14.9.1 Add date range selector UI
- [ ] 14.9.2 Filter calculations by date range
- [ ] 14.9.3 Add presets (This Year, Last 6 Months, All Time)
- [ ] 14.9.4 Update all charts based on selected range

## Statistics Calculations

### Core Metrics

**Total Spending:**
```javascript
totalSpending = rolls.reduce((sum, roll) => {
  if (roll.not_mine) {
    // Friend's roll - only count dev cost
    return sum + (roll.dev_cost || 0);
  }
  // User's roll - count film + dev cost
  return sum + (roll.total_cost || roll.film_cost || 0);
}, 0);
```

**Total Shots:**
```javascript
totalShots = rolls.reduce((sum, roll) => {
  return sum + (roll.actual_exposures || roll.expected_exposures || 0);
}, 0);
```

**Average Cost Per Shot:**
```javascript
avgCostPerShot = totalSpending / totalShots;
```

### Distribution Calculations

**Status Distribution:**
```javascript
statusCounts = {
  NEW: rolls.filter(r => r.status === 'NEW').length,
  LOADED: rolls.filter(r => r.status === 'LOADED').length,
  EXPOSED: rolls.filter(r => r.status === 'EXPOSED').length,
  DEVELOPED: rolls.filter(r => r.status === 'DEVELOPED').length,
  SCANNED: rolls.filter(r => r.status === 'SCANNED').length,
};
```

**Format Distribution:**
```javascript
formatCounts = rolls.reduce((acc, roll) => {
  acc[roll.film_format] = (acc[roll.film_format] || 0) + 1;
  return acc;
}, {});
```

**Top Film Stocks:**
```javascript
stockCounts = rolls.reduce((acc, roll) => {
  acc[roll.film_stock_name] = (acc[roll.film_stock_name] || 0) + 1;
  return acc;
}, {});
// Sort by count and take top 10
topStocks = Object.entries(stockCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
```

## Component Specifications

### StatCard Component
```jsx
<StatCard
  title="Total Spending"
  value="$1,234.56"
  icon="dollar"
  color="green"
  subtitle="Across 42 rolls"
/>
```

**Props:**
- `title` (string) - Card title
- `value` (string) - Main value to display
- `icon` (string) - Icon name from Icon component
- `color` (string) - Color theme (green, blue, purple, etc.)
- `subtitle` (string, optional) - Additional context

### Chart Configuration (Recharts)

**Bar Chart:**
```jsx
<BarChart data={data} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#0891b2" />
</BarChart>
```

**Pie Chart:**
```jsx
<PieChart width={400} height={400}>
  <Pie
    data={data}
    cx={200}
    cy={200}
    labelLine={false}
    label={renderCustomizedLabel}
    outerRadius={80}
    fill="#8884d8"
    dataKey="value"
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

## Styling Guidelines

**Color Palette (from Tailwind config):**
- Primary accent: `#0891b2` (film-cyan)
- Success/money: `#10b981` (green-500)
- Warning: `#f59e0b` (amber-500)
- Chart colors: Use Tailwind color scale (cyan, blue, purple, green, amber)

**Responsive Breakpoints:**
- Mobile: < 640px (1 column)
- Tablet: 640px-1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

**Dark Mode:**
- All charts should support dark mode
- Use `dark:` prefixes in Tailwind classes
- Chart backgrounds should be transparent or use theme-aware colors

## Testing Checklist

- [ ] Page loads without errors
- [ ] Navigation to/from stats page works
- [ ] All tabs switch correctly
- [ ] Metrics calculate correctly with sample data
- [ ] Charts render on all screen sizes
- [ ] Dark mode works for all components
- [ ] Empty states show when no data
- [ ] Loading states display properly
- [ ] Error handling works (failed API calls)

## Future Enhancements (Out of Scope)

- Export statistics to PDF/CSV
- Comparison with previous periods (e.g., "20% more rolls this month")
- Predictive analytics (e.g., "You'll run out of chemistry in 3 weeks")
- Social features (share stats with friends)
- Goals and achievements (e.g., "100 rolls milestone!")

## Notes

- All calculations happen on frontend (acceptable for single-user app)
- No new backend APIs needed (leverage existing endpoints)
- Recharts chosen for React integration and documentation
- Existing film stock thumbnails will be reused for gallery
- Date range filtering deferred to Phase 14.9

Instructions for AI for testing: front-end NPM dev server is already running at 0.0.0.0:5173, no need to run command to spawn another dev.
