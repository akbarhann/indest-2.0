# Project Specification: Village Intelligence & Profile Dashboard

## 1. Project Overview
An advanced data visualization and decision-support system designed to transform village potential data (CSV) into actionable insights. The application features a dual-view architecture:
- **Macro View**: Regional analysis and investment mapping (Regency level).
- **Micro View**: Specific village branding and detailed profiling (Village level).

## 2. Technical Stack
- **Backend**: Python (FastAPI preferred for performance).
- **Database**: PostgreSQL.
- **Machine Learning**: Scikit-learn (K-Means Clustering) for village categorization.
- **AI Integration**: LLM API (Gemini/OpenAI) for SWOT and Narrative Generation.
- **Frontend**: React, Tailwind CSS, Lucide Icons, Chart.js, Leaflet.js (Mapping).
- **Data Processing**: Pandas & NumPy.

---

## 3. Module A: Macro View (Regency Analysis)
*Target: Regional Government & Investors*

### 3.1 Health Radar (Heatmap)
- **UI**: Interactive Heatmap (Red: High Risk | Green: Safe).
- **Logic**: 
  - $$Supply\_Score = (Doctor \times 3) + (Midwife \times 1) + (Puskesmas \times 5)$$
  - $$Demand\_Score = Dengue\_Cases + Malaria\_Cases + Malnutrition\_Cases$$
  - **Condition**: If $Demand > Supply \rightarrow$ Mark as **High Risk (Red)**.
- **Tooltip**: Show ratio of medical personnel per village.

### 3.2 Education Funnel (Bottleneck Analysis)
- **UI**: Color-coded Map Pins.
- **Logic**: 
  - $$Continuity\_Ratio = \frac{SMP + SMA}{SD}$$
  - **Condition**: If Ratio approaches 0 $\rightarrow$ Identify as **"Dropout Risk Zone"**.
- **Statistic**: Calculate villages with the furthest physical distance to the nearest SMA.

### 3.3 Disaster Resilience Matrix
- **UI**: 4-Quadrant Scatter Plot (X: Frequency | Y: Mitigation Readiness).
- **Classification**:
  - **Resilient (Yellow)**: High Risk & High Mitigation.
  - **Danger Zone (Red)**: High Risk & Low Mitigation.
  - **Safe Haven (Green)**: Low Risk.

### 3.4 Digital Gap Map
- **UI**: Opportunity Highlight Pins.
- **Logic Filter**: `IF (Signal == 4G) AND (Product_Exists == True) AND (Logistics_Service == False)`.
- **Goal**: Identify locations for logistics/delivery business expansion.

---

## 4. Module B: Micro View (Village Detail Page)
*Target: Village Admin & Business Partners*

### 4.1 Village Persona (Automatic Branding)
- **Technology**: K-Means Clustering.
- **Inputs**: Topography, primary income, internet signal, market presence, industrial count.
- **Output**: Automatic Badge (e.g., "Agropolitan Trade Hub").

### 4.2 AI-Powered SWOT Analysis
- **Process**: 
  1. Backend extracts facts (e.g., "Roads: Damaged", "Banks: 0").
  2. Send prompt to LLM to generate 4-card SWOT narrative.

### 4.3 Independence Index (Gamification)
- **UI**: Circular Progress Gauges (0-100).
- **Weighting**:
  - **Digital**: Signal, BTS, and Website availability.
  - **Living**: Access to Clean Water, Electricity, and Sanitation.
  - **Economy**: Presence of Markets, Banks, BUMDes, and Cooperatives.

### 4.4 Investment Radar (Gap Analysis)
- **Logic**: Identify Mismatch.
- **Example**: `If Primary_Income == Agriculture AND Agri_Store == 0` $\rightarrow$ Recommend: "Establish Agricultural Supply Store."

### 4.5 Local Hero & Social Capital
- **UI**: AI-generated narrative paragraph.
- **Inputs**: Worship places, poskamling, cooperatives, and social activities.

### 4.6 Infrastructure Detail
- **UI**: Grid of Status Icons (Road type, Power source, Water source, Distance to facilities).

---

## 5. Data Schema Requirements
- **Demographics**: Population, health cases, education levels.
- **Geographic**: Topography, coordinates (lat/long), distances.
- **Economic**: Commodities, SME counts, financial institutions.
- **Infrastructure**: Road condition, signal strength, logistics, disaster tools.

## 6. Implementation Roadmap (Task for Agent)
1. **Phase 1**: Build `ScoringAlgorithm` class and `ClusteringService` in Backend.
2. **Phase 2**: Setup LLM prompt templates for SWOT and Social Capital.
3. **Phase 3**: Create Macro (Map-heavy) and Micro (Dashboard-heavy) UI.
4. **Phase 4**: Connect PostgreSQL processed data to UI via REST API.