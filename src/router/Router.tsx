import ServiceDetailPage from "../screens/ServiceDetailPage";
import ServicesPage from "../screens/ServicesPage";
import SettingsPage from "../screens/SettingsPage";
import { useRoute } from "./hash";

export default function Router() {
  const route = useRoute();

  switch (route.name) {
    case "services":
      return <ServicesPage />;
    case "serviceDetail":
      return <ServiceDetailPage serviceId={route.serviceId} />;
    case "settings":
      return <SettingsPage />;
    case "notFound":
      return (
        <div className="card">
          <h2>Not Found</h2>
          <p className="hint">Unknown route: {route.path}</p>
        </div>
      );
    default:
      return null;
  }
}
