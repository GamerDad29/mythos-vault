import { Switch, Route } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { EntityList } from './pages/EntityList';
import { LocationList } from './pages/LocationList';
import { FactionList } from './pages/FactionList';
import { LoreList } from './pages/LoreList';
import { EntityDetail } from './pages/EntityDetail';
import { Timeline } from './pages/Timeline';
import { Stats } from './pages/Stats';
import { Journal } from './pages/Journal';
import { CityView } from './pages/CityView';
import { Characters } from './pages/Characters';
import { PCDetail } from './pages/PCDetail';
import { Sessions } from './pages/Sessions';
import { SessionDetail } from './pages/SessionDetail';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
    <div className="min-h-screen" style={{ background: 'hsl(15 6% 8%)' }}>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/npcs" component={() => <EntityList type="NPC" groupBy="cityId" />} />
          <Route path="/creatures" component={() => <EntityList type="CREATURE" />} />
          <Route path="/locations" component={LocationList} />
          <Route path="/factions" component={FactionList} />
          <Route path="/items" component={() => <EntityList type="ITEM" groupBy="category" />} />
          <Route path="/lore" component={LoreList} />
          <Route path="/characters" component={Characters} />
          <Route path="/characters/:slug" component={PCDetail} />
          <Route path="/sessions" component={Sessions} />
          <Route path="/sessions/:slug" component={SessionDetail} />
          <Route path="/timeline" component={Timeline} />
          <Route path="/stats" component={Stats} />
          <Route path="/journal" component={Journal} />
          <Route path="/city/:slug" component={CityView} />
          <Route path="/:type/:slug" component={EntityDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
    </AuthProvider>
  );
}
