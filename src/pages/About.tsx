import { Link } from "react-router-dom"
import { FiArrowUpRight } from "react-icons/fi"
import { FaFacebookF, FaInstagram } from "react-icons/fa"
import { motion } from "framer-motion"
import { PageShell } from "../components/layout/Layout"
import { SmartImage } from "../components/tiles/Tiles"
import { site } from "../config/site"
import { usePosts } from "../hooks/usePosts"
export default function About() {
  const { posts } = usePosts()
  return (
    <PageShell
      eyebrow="THE PERSON BEHIND THE PAGES"
      title="A little about me."
      description={site.tagline}
    >
      <div className="about-grid">
        <div className="about-portrait" data-scroll-label="Hello">
          <SmartImage src={site.portrait} alt={site.authorName} />
          <span>ALWAYS TAKING THE SCENIC ROUTE</span>
        </div>
        <section className="about-intro blue-tile">
          <span className="eyebrow">HELLO, FELLOW WANDERER</span>
          <h2>
            Hi, I’m
            <br />
            {site.authorName.split(" ")[0]}.
          </h2>
          <p>{site.bio}</p>
          <p>{site.about}</p>
          <span className="signature">{site.authorName.split(" ")[0]}.</span>
        </section>
        <div className="stats" data-scroll-label="Story">
          {[
            [
              posts.filter((p) => p.status === "published").length,
              "Stories & counting",
            ],
            [site.countries, "Countries explored"],
            [site.years, "Years on the road"],
          ].map(([n, label]) => (
            <div key={label}>
              <strong>
                {n}
                <span>+</span>
              </strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
        <section className="about-topics">
          <span className="eyebrow">LITTLE THINGS, BIG STORIES</span>
          <h2>What I write about.</h2>
          <p>
            Places that stay with you. Thoughts that need a little space. The
            art of living a little more slowly.
          </p>
          <div className="tag-row">
            {["Travel", "Adventure", "Lifestyle", "Life & thoughts"].map(
              (c) => (
                <Link
                  className="chip"
                  to={`/blog?category=${encodeURIComponent(c)}`}
                  key={c}
                >
                  {c}
                  <FiArrowUpRight />
                </Link>
              ),
            )}
          </div>
        </section>
        <section className="journey" data-scroll-label="Journey">
          <span className="eyebrow">ONE STEP AT A TIME</span>
          <h2>My journey.</h2>
          {site.timeline.map((t) => (
            <motion.div
              className="timeline-item"
              key={t.year}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span>{t.year}</span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            </motion.div>
          ))}
        </section>
        <Link
          className="about-cta blue-tile"
          to="/contact"
          data-scroll-label="Say hi"
        >
          <span className="eyebrow">GOOD STORIES START WITH HELLO</span>
          <h2>Let’s talk.</h2>
          <FiArrowUpRight />
        </Link>
        <a
          className="social-tile"
          href={site.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram />
          <h3>
            Little moments,
            <br />
            in little squares.
          </h3>
          <span>
            Find me on Instagram <FiArrowUpRight />
          </span>
        </a>
        <a
          className="social-tile"
          href={site.facebook}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebookF />
          <h3>
            Keep in touch.
            <br />
            Keep exploring.
          </h3>
          <span>
            Follow on Facebook <FiArrowUpRight />
          </span>
        </a>
      </div>
    </PageShell>
  )
}
