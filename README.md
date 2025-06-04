# Earthquake Data Visualization Dashboard

A modern, interactive single-page application for visualizing and analyzing earthquake data from the USGS (United States Geological Survey). Built with React, TypeScript, and a robust set of modern libraries.

## 🌟 Features

### Interactive Visualization
- **Scatter Plot Chart**: Dynamic scatter plot with customizable X and Y axes
- **Real-time Interactions**: Click and hover interactions between chart and table
- **Magnitude-based Coloring**: Visual encoding using color and size to represent earthquake magnitude
- **Responsive Design**: Optimized for desktop and laptop screens

### Data Management
- **Live Data Source**: Fetches real earthquake data from USGS CSV feed
- **Smart Filtering**: Filter by magnitude range and geographic regions
- **Data Processing**: Automatic categorization and enhancement of raw data
- **Loading States**: Comprehensive loading indicators and error handling

### User Interactions
- **Bi-directional Selection**: Select earthquakes in table to highlight in chart and vice versa
- **Dynamic Filtering**: Real-time filtering with magnitude sliders and region checkboxes
- **Scrollable Table**: Full-featured data table with sticky headers
- **Hover Effects**: Immediate visual feedback on data point hover

### State Management Patterns
The application demonstrates three different state management approaches:

1. **Props Pattern**: Data and handlers passed from parent to child components
2. **React Context**: Global context for managing selected earthquake state
3. **Zustand Store**: Global state store for filters, selections, and computed data

## 🛠️ Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS 4.1** - Utility-first CSS framework
- **TanStack Query 5** - Data fetching, caching, and synchronization
- **Recharts 2.15** - Composable charting library
- **Zustand 5** - Lightweight state management

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reknowledge-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/
│   ├── chart/
│   │   └── EarthquakeChart.tsx    # Interactive scatter plot
│   ├── table/
│   │   └── EarthquakeTable.tsx    # Data table with selection
│   ├── filters/
│   │   └── FilterPanel.tsx        # Magnitude and region filters
│   ├── common/
│   │   ├── LoadingSpinner.tsx     # Loading indicator
│   │   └── ErrorMessage.tsx       # Error display
│   └── Dashboard.tsx              # Main layout component
├── contexts/
│   └── EarthquakeContext.tsx      # React Context for selection
├── stores/
│   └── earthquakeStore.ts         # Zustand global store
├── hooks/
│   └── useEarthquakeData.ts       # React Query data fetching
├── utils/
│   └── dataProcessing.ts          # Data parsing and enhancement
├── types/
│   └── earthquake.ts              # TypeScript interfaces
└── App.tsx                        # Root component with providers
```

## 📊 Data Source

The application fetches live earthquake data from:
- **Source**: USGS Earthquake Hazards Program
- **URL**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv
- **Coverage**: All earthquakes from the past month
- **Update Frequency**: Real-time updates from USGS

### Data Processing

Raw CSV data is enhanced with:
- **Date Parsing**: Converts ISO strings to Date objects
- **Geographic Regions**: Extracts state/country from location descriptions
- **Magnitude Categories**: Classifies earthquakes (Micro, Minor, Light, Moderate, Strong, Major, Great)
- **Depth Categories**: Shallow (<70km), Intermediate (70-300km), Deep (>300km)

## 🎨 UI/UX Features

### Layout
- **Three-panel design**: Filters sidebar, chart panel, and data table panel
- **Responsive**: Adapts to different screen sizes
- **Sticky headers**: Table headers remain visible during scrolling

### Visual Design
- **Modern aesthetics**: Clean, professional interface using TailwindCSS
- **Color coding**: Magnitude-based color schemes for easy pattern recognition
- **Interactive feedback**: Hover states, selection highlights, and transitions

### Accessibility
- **Keyboard navigation**: Full keyboard support for interactive elements
- **Screen reader friendly**: Semantic HTML and proper labeling
- **High contrast**: Clear visual distinctions for all UI elements

## 🔧 Configuration

### Environment Variables
No environment variables are required for basic functionality. The application uses public USGS data endpoints.

### Customization
- **Data refresh interval**: Modify `staleTime` in `useEarthquakeData.ts`
- **Chart appearance**: Customize colors and sizes in `EarthquakeChart.tsx`
- **Filter options**: Adjust default ranges in `earthquakeStore.ts`

## 🐛 Troubleshooting

### Common Issues

1. **Data loading fails**
   - Check internet connection
   - Verify USGS endpoint is accessible
   - Try refreshing the page

2. **Chart not rendering**
   - Ensure data contains valid numeric values
   - Check browser console for errors
   - Verify Recharts compatibility

3. **Performance issues**
   - Large datasets may cause slowdown
   - Consider implementing virtualization for tables
   - Monitor memory usage in dev tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **USGS** for providing free, real-time earthquake data
- **React community** for excellent tooling and libraries
- **TailwindCSS** for the utility-first CSS approach
