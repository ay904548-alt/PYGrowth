Convert every Growth Tool card from a static UI into a fully interactive web application.

When a visitor clicks Launch Tool, do not navigate to another page. Instead, open a centered modal on desktop and a full-screen drawer on mobile.

Every tool should operate entirely on the client side using HTML, CSS, and JavaScript.

No backend, authentication, database, API, or server-side processing is required.

The interaction flow should be identical across every tool.

User clicks Launch Tool
Calculator opens
User completes the inputs
User clicks Analyze
Show a one-second loading animation with contextual messages such as:
"Analyzing Marketplace Metrics..."
"Calculating Business Performance..."
"Evaluating Business Health..."
"Generating Growth Insights..."
Display results using animated KPI cards, charts, gauges, and business insights.

At the bottom of every calculator include a primary CTA:

Discuss These Results

Clicking this button should automatically open the consultation form while pre-selecting the relevant diagnosis category.

TOOL 1 — MARKETPLACE PROFIT CALCULATOR
Inputs
Product MRP (₹)
Average Selling Discount (%)
Production Cost / COGS (₹)
Marketplace Commission (%)
Shipping Cost (₹)
Packaging Cost (₹)
Return Rate (%)
Return Cost per Order (₹)
Advertising Spend per Order (₹)
GST Rate (%)
Calculations

Selling Price

= MRP × (1 − Discount%)

Commission

= Selling Price × Commission%

GST

= Selling Price × GST%

Expected Return Cost

= Return Rate × Return Cost

Total Cost

= COGS + Commission + Shipping + Packaging + Advertising + GST + Expected Return Cost

Net Profit

= Selling Price − Total Cost

Profit Margin %

= (Net Profit ÷ Selling Price) × 100

Display
Selling Price
Total Cost
Net Profit
Profit Margin
Profit Health Gauge
Pie Chart (Cost Breakdown)
Horizontal Cost Distribution Chart
Profit Health

>30%

Excellent (Green)

20–30%

Healthy (Blue)

10–20%

Moderate (Amber)

<10%

Critical (Red)

Automatically generate concise business recommendations based on the calculated results.

TOOL 2 — DISCOUNT IMPACT ANALYZER
Inputs
MRP
Current Discount %
New Discount %
COGS
Commission %
Advertising %
Shipping
Packaging
Calculations

Calculate profitability before discount.

Calculate profitability after discount.

Calculate:

Profit Difference
Margin Difference
Required Order Volume

Formula

Required Orders

= Old Profit ÷ New Profit

Display
Previous Profit
New Profit
Profit Lost
Extra Orders Required
Margin Comparison
Interactive Bar Chart

Generate practical recommendations explaining whether the proposed discount is financially justified.

TOOL 3 — ROAS CALCULATOR
Inputs
Advertising Spend
Revenue Generated
Orders
Average Order Value
Gross Margin %
Calculations

ROAS

= Revenue ÷ Ad Spend

CPA

= Ad Spend ÷ Orders

Advertising Cost %

= Ad Spend ÷ Revenue

Gross Profit

= Revenue × Gross Margin%

Net Profit After Ads

= Gross Profit − Ad Spend

Display
ROAS
CPA
Advertising Cost %
Gross Profit
Profit After Advertising
Performance Gauge
Performance Rating

ROAS >5

Excellent

ROAS 3–5

Healthy

ROAS 2–3

Moderate

ROAS <2

Poor

Generate actionable business recommendations.

TOOL 4 — MARKETPLACE READINESS ASSESSMENT

Create a structured business assessment containing approximately 35–40 questions grouped into these sections:

Business Foundation
Catalog Quality
Pricing
Inventory
Advertising
Operations
Brand Identity
Customer Experience
Analytics
Marketplace Compliance

Each response receives a score from 0–5.

Calculate

Overall Readiness Score

= Obtained Score ÷ Maximum Score × 100

Display
Circular Readiness Score
Category Breakdown
Interactive Radar Chart
Business Strengths
Weaknesses
Priority Improvements
Grades

90–100

Marketplace Leader

75–89

Ready to Scale

60–74

Needs Optimization

Below 60

Foundation Required

TOOL 5 — REVENUE PROJECTION PLANNER
Inputs
Monthly Visitors
Current Conversion Rate
Target Conversion Rate
Average Order Value
Repeat Purchase Rate
Monthly Growth %
Projection Period

Options

3 Months
6 Months
12 Months
Calculations

Orders

= Visitors × Conversion Rate

Revenue

= Orders × Average Order Value

Apply Monthly Growth.

Generate month-by-month revenue projections.

Display
Projected Revenue
Revenue Increase
Additional Orders
Growth Percentage
Interactive Line Chart
Revenue Comparison Chart

Include this note:

These projections are estimates based on your assumptions and should not be interpreted as guaranteed business outcomes.

TOOL 6 — GROWTH DIAGNOSIS

Build an intelligent business diagnosis questionnaire.

Include approximately 20 strategic questions covering:

Current Marketplaces
Revenue Stage
Biggest Business Challenge
Advertising
Inventory
Margins
Returns
Brand Positioning
Customer Acquisition
Operations
Expansion Plans
Score responses into these diagnosis categories
Marketplace Visibility
Profitability
Advertising Performance
Catalog Optimization
Business Systems
Marketplace Expansion
Display
Primary Diagnosis
Secondary Diagnosis
Overall Business Health Score
Three Highest-Impact Recommendations
Suggested Growth OS Phase
Relevant PY Growth consulting solution

Finish with a primary CTA:

Book Growth Consultation

Automatically pre-select the diagnosis category inside the consultation form.

COMMON DESIGN SYSTEM

Every Growth Tool should follow the existing PY Growth Design System.

Presentation

Display every calculator inside premium modals with:

Large spacing
Rounded corners
Premium typography
Consistent component spacing
Subtle borders
Minimal shadows
User Experience
Instant input validation
Real-time calculations
Animated KPI numbers
Animated charts after calculations
Smooth loading animation before results
Recommendations written in clear business language instead of technical jargon
Responsiveness

Support:

Desktop
Tablet
Mobile

Use adaptive layouts instead of simply shrinking desktop designs.

Technical Requirements
No placeholder values
No randomly generated numbers
Every calculation updates instantly whenever an input changes
Fully client-side implementation using only HTML, CSS, and JavaScript
No backend
No APIs
No authentication
No database
Final Experience

These Growth Tools should feel like the first version of a premium Marketplace Intelligence Platform built by PY Growth, rather than simple online calculators.

The experience should communicate structured business intelligence, thoughtful decision-making, and product-quality execution—consistent with a modern SaaS platform rather than a traditional consulting website.