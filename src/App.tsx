import { Switch, Route } from 'wouter';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { EntityList } from './pages/EntityList';
import { LocationList } from './pages/LocationList';
import { EntityDetail } from './pages/EntityDetail';
import { Timeline } from './pages/Timeline';
import { Stats } from './pages/Stats';
import { Journal } from './pages/Journal';
import { KarnukDemo } from './pages/KarnukDemo';
import { CityView } from './pages/CityView';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/npcs" component={() => <EntityList type="NPC" groupBy="cityId" />} />
          <Route path="/creatures" component={() => <EntityList type="CREATURE" />} />
          <Route path="/locations" component={LocationList} />
          <Route path="/factions" component={() => <EntityList type="FACTION" groupBy="cityId" />} />
          <Route path="/items" component={() => <EntityList type="ITEM" groupBy="category" />} />
          <Route path="/lore" component={() => <EntityList type="LORE" />} />
          <Route path="/characters" component={() => <EntityList type="PC" />} />
          <Route path="/pcs" component={() => <EntityList type="PC" />} />
          <Route path="/timeline" component={Timeline} />
          <Route path="/stats" component={Stats} />
          <Route path="/journal" component={Journal} />
          <Route path="/demo/karnuk" component={KarnukDemo} />
          <Route path="/city/:slug" component={CityView} />
          <Route path="/:type/:slug" component={EntityDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
