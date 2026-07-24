/**
 * 应用入口文件
 * @description 使用 React 19 createRoot 渲染 App 组件到 DOM
 * @module main
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Ensure there is a <div id="root"> in index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
