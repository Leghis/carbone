# Carbon Footprint Calculator

## Description
This project is an interactive carbon footprint calculator developed with Next.js and TypeScript. It allows users to assess their annual environmental impact by considering three main aspects: transportation, energy, and lifestyle.

## Main Features

- **Detailed calculation by sector**
    - Transportation (car, public transport, flights)
    - Energy (electricity consumption, heating)
    - Lifestyle (diet, consumption, waste)

- **Intuitive User Interface**
    - Step-by-step navigation
    - Progressive forms
    - Results visualization
    - Smooth animations with Framer Motion

- **Personalized Results**
    - Total carbon footprint in tonnes CO2e/year
    - Detailed breakdown by sector
    - Comparison with national and global averages
    - Personalized recommendations for impact reduction

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Shadcn/ui

## Installation

1. Clone the repository:
```bash
git clone [REPO_URL]
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   └── page.tsx           # Main calculator page
├── components/
│   └── ui/               # Reusable UI components
├── types/                # TypeScript definitions
└── constants/            # Emission factors and constants
```

## Emission Factors

The calculator uses emission factors based on scientific data for:
- Different vehicle types
- Energy sources
- Dietary patterns
- Consumption patterns

Unit conversions are integrated for:
- Natural gas (m³ to kWh)
- Fuel oil (liters to kWh)
- Electricity (already in kWh)

## Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Future Improvements

- Addition of new calculation categories
- Improvement of emission factors accuracy
- Integration of regional data
- PDF export of results
- Offline mode
- Multilingual support

## License

[MIT License](LICENSE)

## Contact

[https://www.linkedin.com/in/ayinamaerik/]


**Note**: This calculator provides estimates based on averages and approximations. For more accurate calculations, please consult environmental experts.

## Development Guidelines

### Adding New Features
1. Create a new branch
2. Follow TypeScript best practices
3. Add necessary tests
4. Update documentation

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting

### Testing
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

## API Documentation

### Data Models

```typescript
interface TransportData {
  carType: string;
  carKm: number;
  // ... other transport properties
}

interface EnergyData {
  homeType: string;
  homeSize: number;
  // ... other energy properties
}

interface LifestyleData {
  dietType: string;
  localFoodPercentage: number;
  // ... other lifestyle properties
}
```

### Calculation Methods

The calculator uses various methods to compute emissions:
- Transportation emissions calculation
- Energy consumption conversion
- Lifestyle impact assessment


## Deployment

### Prerequisites
- Node.js 14.x or higher
- npm 6.x or higher

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t carbon-calculator .
docker run -p 3000:3000 carbon-calculator
```

## Support

For support, please open an issue in the GitHub repository or contact [ayinamaerik@gmail.com].

## Roadmap

- Q1 2024: Add API integration
- Q2 2024: Implement offline mode
- Q3 2024: Add multilingual support
- Q4 2024: Mobile app development