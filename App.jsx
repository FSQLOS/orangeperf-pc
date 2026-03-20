import React from 'react';
import './App.css';
import MobileDashboard from './MobileDashboardDesktop';
import { config } from './config';

export default function App() {
  return <MobileDashboard config={config} />;
}
