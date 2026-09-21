import React from 'react';
import { DynamicUIComponent } from '../../types';
import { NewsCard } from '../cards/NewsCard';
import { SearchResultsCard } from '../cards/SearchResultsCard';
import { WeatherCard } from '../cards/WeatherCard';
import { CalculationCard } from '../cards/CalculationCard';
import { MemoryCard } from '../cards/MemoryCard';
import { SystemStatusCard } from '../cards/SystemStatusCard';
import { TimeCard } from '../cards/TimeCard';
import { SummaryCard } from '../cards/SummaryCard';

interface DynamicResponseRendererProps {
  component: DynamicUIComponent;
}

export const DynamicResponseRenderer: React.FC<DynamicResponseRendererProps> = ({ component }) => {
  switch (component.type) {
    case 'NEWS':
      return <NewsCard data={component.data} />;

    case 'SEARCH_RESULTS':
      return <SearchResultsCard data={component.data} />;

    case 'WEATHER':
      return <WeatherCard data={component.data} />;

    case 'CALCULATION':
      return <CalculationCard data={component.data} />;

    case 'MEMORY':
      return <MemoryCard data={component.data} />;

    case 'SYSTEM_STATUS':
      return <SystemStatusCard data={component.data} />;

    case 'TIME':
      return <TimeCard data={component.data} />;

    case 'SUMMARY':
    default:
      return <SummaryCard data={component.data} title={component.title} />;
  }
};

