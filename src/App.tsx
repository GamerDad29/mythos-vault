import { Switch, Route } from 'wouter';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { EntityList } from './pages/EntityList';
import { EntityDetail } from './pages/EntityDetail';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/npcs" component={() => <EntityList type="NPC" />} />
          <Route path="/locations" component={() => <EntityList type="LOCATION" />} />
          <Route path="/factions" component={() => <EntityList type="FACTION" />} />
          <Route path="/items" component={() => <EntityList type="ITEM" />} />
          <Route path="/lore" component={() => <EntityList type="LORE" />} />
          <Route path="/:type/:slug" component={EntityDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
