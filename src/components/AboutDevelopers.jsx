import Image from "next/image";
import Link from "next/link";
const developers = [
  {
    name: "Nikhil",
    role: "Frontend Developer",
    bio: "Passionate about creating user-friendly interfaces.",
    image: "/nikhil.png",
    linkedin: "https://linkedin.com/in/nikhil-suraj-devathi-019a4a358",
    github: "https://github.com/Nikhil1869",
  },
  {
    name: "Vishal",
    role: "Backend Developer",
    bio: "Loves building scalable and efficient server-side applications.",
    image: "/vishal.jpeg",
    linkedin: "https://linkedin.com/in/vishalkarnati",
    github: "https://github.com/vishalkarnati",
  },
  {
    name: "Santosh",
    role: "UI/UX Designer",
    bio: "Focused on designing beautiful and intuitive user experiences.",
    image: "/santosh.jpeg",
    linkedin: "https://linkedin.com/in/ramineni-karthik-santosh-1b6272322/",
    github: "https://github.com/RKarthikSantosh",
  },
];
export default function AboutDevelopers() {
  return (
    <main className="page-container section-space">
      <span className="eyebrow">Built as a team. Improved together.</span>
      <h1 className="page-title">The people behind Fixit.</h1>
      <p className="lead">
        Fixit began as a group project by students at CVR College of Engineering. Our shared goal is
        to make service booking easier to organize and understand.
      </p>
      <div className="grid md:grid-cols-3 gap-6 my-10">
        {developers.map((d) => (
          <article key={d.name} className="surface">
            <div className="relative w-28 h-28 mb-6 overflow-hidden rounded-2xl">
              <Image src={d.image} alt={d.name} fill sizes="112px" className="object-cover" />
            </div>
            <h2>{d.name}</h2>
            <p className="accent font-semibold mt-2">{d.role}</p>
            <p className="subtle mt-3">{d.bio}</p>
            <div className="flex gap-6 mt-6">
              <a className="text-link" href={d.github}>
                GitHub ↗
              </a>
              <a className="text-link" href={d.linkedin}>
                LinkedIn ↗
              </a>
            </div>
          </article>
        ))}
      </div>
      <section className="surface">
        <h2>Our project’s next chapter.</h2>
        <p className="subtle mt-4">
          Nikhil is continuing the team project with stronger authorization, reliable booking
          transitions, automated tests, and a clearer interface. Original team history and credits
          are preserved. New improvements are documented separately in the repository, including AI
          assistance.
        </p>
        <p className="subtle mt-3">
          This is a portfolio demonstration with self-registered providers. Public deployment and a
          formal open-source license remain subject to the team’s agreement.
        </p>
        <Link className="text-link mt-5" href="https://github.com/Nikhil1869/Fixit">
          Explore the repository ↗
        </Link>
      </section>
    </main>
  );
}
