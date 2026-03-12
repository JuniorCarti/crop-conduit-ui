import { motion } from "framer-motion";
import { Mail, Phone, Building2, Clock, ExternalLink } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const HQ: [number, number] = [-0.0917, 34.7680];

// Fix default marker icons in Vite by providing explicit URLs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export function LocationContact() {
  return (
    <section id="contact" className="py-20">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-section-label">Our Location</p>
          <h2 className="agri-section-title">Visit AgriSmart in Kisumu</h2>
          <p className="mt-4 text-muted-foreground">
            Visit or contact AgriSmart at our headquarters in Kisumu as we build the future of smart agriculture across
            Kenya.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="agri-card"
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Headquarters</p>
                  <p>Kisumu, Kenya</p>
                  <p className="mt-2 text-xs text-muted-foreground">Future Office: Nairobi (planned)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Email</p>
                  <a href="mailto:agrismartk@gmail.com" className="hover:text-foreground">
                    agrismartk@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Phone</p>
                  <a href="tel:+254113245740" className="hover:text-foreground">
                    +254 113 245 740
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Office Hours</p>
                  <p>Monday – Friday</p>
                  <p>8:00 AM – 5:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">LinkedIn</p>
                  <a
                    href="https://www.linkedin.com/company/agrismartkenyainc/"
                    className="hover:text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AgriSmart Kenya Inc
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            viewport={{ once: true, amount: 0.4 }}
            className="rounded-3xl border border-border/50 bg-card shadow-card overflow-hidden"
          >
            <div className="h-[320px] w-full sm:h-[380px] lg:h-[420px]">
              <MapContainer center={HQ} zoom={13} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={HQ}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">AgriSmart Kenya Inc</p>
                      <p>Kisumu, Kenya</p>
                      <p>
                        Email: <a href="mailto:agrismartk@gmail.com">agrismartk@gmail.com</a>
                      </p>
                      <p>Phone: +254 113 245 740</p>
                      <p>Office Hours: Mon – Fri, 8:00 AM – 5:00 PM</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="flex items-center justify-end bg-card/80 px-4 py-3">
              <a
                href="https://www.openstreetmap.org/?mlat=-0.0917&mlon=34.7680#map=14/-0.0917/34.7680"
                target="_blank"
                rel="noreferrer"
                className="agri-btn-secondary"
              >
                Open in OpenStreetMap
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
