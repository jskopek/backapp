import { getServiceById } from "../services/registry";

type Props = {
  serviceId: string;
};

export default function ServiceDetailPage({ serviceId }: Props) {
  const service = getServiceById(serviceId);

  if (!service) {
    return (
      <section className="card">
        <h2>Unknown service</h2>
        <p className="hint">No built-in service with id “{serviceId}”.</p>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="breadcrumbs">
          <a href="#/services" className="link">
            Services
          </a>
          <span className="breadcrumbsSep">/</span>
          <span>{service.name}</span>
        </div>

        <h2>{service.name}</h2>
        <p className="hint">{service.description}</p>
      </section>

      <section className="card">
        <h3>Backups</h3>
        <ul className="list">
          <li className="listRow">
            <div>
              <div className="listTitle">Example backup</div>
              <div className="hint">Imported: —</div>
            </div>
            <button className="button" disabled>
              View
            </button>
          </li>
        </ul>
        <p className="hint">Import + indexing comes in step 05+.</p>
      </section>
    </div>
  );
}

