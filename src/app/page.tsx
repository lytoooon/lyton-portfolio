import NavBar from "@/components/NavBar";
import Brush from "@/components/Brush";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Work from "@/components/Work";
import Path from "@/components/Path";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Brush />
      <NavBar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Work />
        <Path />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
