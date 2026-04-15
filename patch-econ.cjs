const fs = require('fs');
const content = fs.readFileSync('src/pages/ClimatePage.tsx', 'utf8');

const oldBlock = `  const decisionSupport = useMemo<DecisionSupportOutput>(() => {
    return buildDecisionSupport({
      crop: aiCrop,
      location: {
        county: selectedFarm?.county,

        ward: selectedFarm?.ward,
        name: selectedFarm?.name,
      },
      forecastDaily: decisionForecast,
      marketOracleData: oraclePrices ?? [],

    });
  }, [aiCrop, decisionForecast, oraclePrices, selectedFarm?.county, selectedFarm?.name, selectedFarm?.ward]);`;

const newBlock = `  const decisionSupport = useMemo<DecisionSupportOutput>(() => {
    return buildDecisionSupport({
      crop: aiCrop,
      location: {
        county: selectedFarm?.county,
        ward: selectedFarm?.ward,
        name: selectedFarm?.name,
      },
      forecastDaily: decisionForecast,
      marketOracleData: oraclePrices ?? [],
      economicSignals,
    });
  }, [aiCrop, decisionForecast, oraclePrices, economicSignals, selectedFarm?.county, selectedFarm?.name, selectedFarm?.ward]);`;

if (!content.includes(oldBlock)) {
  console.log('BLOCK_NOT_FOUND');
  process.exit(1);
}

fs.writeFileSync('src/pages/ClimatePage.tsx', content.replace(oldBlock, newBlock), 'utf8');
console.log('SUCCESS');
