
import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home,
  MapPin,
  ShieldCheck,
  Zap
} from "lucide-react";
import "./styles/App.css";

const features = [
  {
    icon: MapPin,
    title: "Find a charging point",
    description: "Discover available EV charging stations around you and choose one that fits your journey."
  },
  {
    icon: Home,
    title: "Share your home charger",
    description: "Turn your private charging point into a community resource whenever it is available."
  },
  {
    icon: CircleDollarSign,
    title: "Earn while you share",
    description: "Set your own charging rates and earn from your unused charging capacity."
  }
];

const steps = [
  {
    number: "01",
    title: "Find a station",
    description: "Explore nearby public and community charging stations."
  },
  {
    number: "02",
    title: "Book your slot",
    description: "Select a suitable time and reserve your charging session."
  },
  {
    number: "03",
    title: "Charge and go",
    description: "Start your session, track your usage and pay for the energy consumed."
  }
];

function App() {
  return (
    <div className="site-shell">
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark"><Zap size={21} fill="currentColor" /></span>
          <span>gridpulse</span>
        </a>

        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#community">Community</a>
          <a href="#features">Features</a>
        </div>

        <div className="nav-actions">
          <a href="#" className="login-link">Log in</a>
          <a href="#" className="nav-cta">Get started <ArrowUpRight size={16} /></a>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              THE FUTURE OF COMMUNITY CHARGING
            </div>

            <h1>
              Power your journey.
              <span> Share the energy.</span>
            </h1>

            <p className="hero-description">
              Find EV charging stations, reserve your spot, or share your
              own home charger with a growing community of electric
              vehicle drivers.
            </p>

            <div className="hero-actions">
              <a href="#" className="primary-button">
                Explore stations <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="secondary-button">
                Discover how it works
              </a>
            </div>

            <div className="hero-trust">
              <div className="trust-icon"><ShieldCheck size={18} /></div>
              <span>Smarter charging. Stronger communities.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <div className="image-overlay" />
              <div className="floating-card availability-card">
                <div className="availability-top">
                  <span className="status-dot" />
                  <span>COMMUNITY STATION</span>
                </div>
                <div className="availability-name">GreenPark Charging Hub</div>
                <div className="availability-location">
                  <MapPin size={13} /> Mangaluru, Karnataka
                </div>
                <div className="availability-bottom">
                  <div>
                    <strong>3</strong>
                    <span>Slots available</span>
                  </div>
                  <div>
                    <strong>₹12</strong>
                    <span>Per kWh</span>
                  </div>
                </div>
              </div>

              <div className="floating-card charge-card">
                <div className="charge-icon"><BatteryCharging size={19} /></div>
                <div>
                  <strong>Ready to charge</strong>
                  <span>Find your next power stop</span>
                </div>
              </div>
            </div>
            <div className="hero-caption">
              <span>01 / COMMUNITY POWER</span>
              <span>CHARGE BEYOND THE ORDINARY</span>
            </div>
          </div>
        </section>

        <section className="stats-strip">
          <div className="stat-item">
            <Zap size={20} />
            <div><strong>One platform</strong><span>For every charging need</span></div>
          </div>
          <div className="stat-item">
            <Home size={20} />
            <div><strong>Shared charging</strong><span>Make every charger count</span></div>
          </div>
          <div className="stat-item">
            <Clock3 size={20} />
            <div><strong>Easy booking</strong><span>Plan before you plug in</span></div>
          </div>
          <div className="stat-item">
            <ShieldCheck size={20} />
            <div><strong>Secure platform</strong><span>Designed around your data</span></div>
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="section-heading">
            <span className="section-kicker">CHARGING, REIMAGINED</span>
            <h2>Everything you need.<br /><span>All in one place.</span></h2>
            <p>Whether you're looking for a charge or sharing your own, GridPulse makes it simple.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon"><Icon size={22} /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <a href="#" className="text-link">Learn more <ArrowUpRight size={16} /></a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="community-section" id="community">
          <div className="community-content">
            <span className="section-kicker">POWER IS BETTER SHARED</span>
            <h2>Your charger.<br />Your community.<br /><span>More possibilities.</span></h2>
            <p>
              Have a home charging point? Make it available to other EV
              drivers when you're not using it. Set your availability,
              manage bookings and earn from every successful session.
            </p>
            <a href="#" className="primary-button">
              Become a host <ArrowRight size={18} />
            </a>
          </div>

          <div className="community-visual">
            <div className="community-circle circle-one" />
            <div className="community-circle circle-two" />
            <div className="home-illustration">
              <div className="home-icon"><Home size={42} /></div>
              <div className="home-charger"><Zap size={27} fill="currentColor" /></div>
              <div className="home-car"><CarFront size={70} /></div>
              <div className="home-label"><CheckCircle2 size={16} /> Charger shared successfully</div>
            </div>
          </div>
        </section>

        <section className="steps-section" id="how-it-works">
          <div className="section-heading centered">
            <span className="section-kicker">SIMPLE BY DESIGN</span>
            <h2>Three steps to a <span>smarter charge.</span></h2>
            <p>Getting started with GridPulse is easy.</p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-cta">
          <div>
            <span className="section-kicker">LET'S MOVE FORWARD</span>
            <h2>Ready to power a better journey?</h2>
            <p>Join a smarter, more connected EV charging community.</p>
          </div>
          <a href="#" className="dark-button">Get started <ArrowUpRight size={17} /></a>
        </section>
      </main>

      <footer className="footer">
        <a href="#" className="brand footer-brand">
          <span className="brand-mark"><Zap size={20} fill="currentColor" /></span>
          <span>gridpulse</span>
        </a>
        <p>Power Your Journey. Share the Energy.</p>
        <span className="copyright">© 2026 GridPulse. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;
