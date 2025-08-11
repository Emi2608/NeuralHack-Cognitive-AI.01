import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './App.css';
import './styles/globals.css';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ConsentPage } from './pages/auth/ConsentPage';
import EmailConfirmationPage from './pages/auth/EmailConfirmationPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Assessment Pages
import { MoCAPage } from './pages/assessments/MoCAPage';
import { PHQ9Page } from './pages/assessments/PHQ9Page';
import { MMSEPage } from './pages/assessments/MMSEPage';
import { AD8Page } from './pages/assessments/AD8Page';
import { ParkinsonsPage } from './pages/assessments/ParkinsonsPage';

// Debug components
import { AuthDebugger } from './components/debug/AuthDebugger';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthDebugger enabled={import.meta.env.DEV} />
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/consent">
          <ConsentPage />
        </Route>
        <Route exact path="/auth/confirm">
          <EmailConfirmationPage />
        </Route>
        <Route exact path="/dashboard">
          <DashboardPage />
        </Route>
        <Route exact path="/assessments/moca">
          <MoCAPage />
        </Route>
        <Route exact path="/assessments/phq9">
          <PHQ9Page />
        </Route>
        <Route exact path="/assessments/mmse">
          <MMSEPage />
        </Route>
        <Route exact path="/assessments/ad8">
          <AD8Page />
        </Route>
        <Route exact path="/assessments/parkinsons">
          <ParkinsonsPage />
        </Route>
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;