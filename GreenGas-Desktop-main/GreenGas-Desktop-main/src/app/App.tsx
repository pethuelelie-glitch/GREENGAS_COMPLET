import { BrowserRouter } from 'react-router-dom';
import { Fournisseurs } from './Fournisseurs';
import { RoutesApp } from './Routes';

export function App() {
  return (
    <BrowserRouter>
      <Fournisseurs>
        <RoutesApp />
      </Fournisseurs>
    </BrowserRouter>
  );
}
