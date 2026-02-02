import { BUILT_IN_SERVICES } from "../services/registry";

export default function ServicesPage() {
  return (
    <section className="card">
      <h2>Services</h2>
      <p className="hint">
        Pick a service to import an offline export and browse it.
      </p>

      <div className="serviceCards">
        {BUILT_IN_SERVICES.map((service) => (
          <a
            key={service.id}
            href={`#/services/${service.id}`}
            className="serviceCard"
          >
            <div className="serviceCardTitle">{service.name}</div>
            <div className="serviceCardDescription">{service.description}</div>
            <div className="serviceCardMeta">Last backup: —</div>
          </a>
        ))}
      </div>
    </section>
  );
}

