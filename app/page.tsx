'use client'

import "../styles/globals.css";
import Footer from "./components/Footer";
import HeroSection from "./components/home/HeroSection";
import WhyPantauTularSection from "./components/home/WhyPantauTularSection";
import FeaturesSection from "./components/home/AdvantagesSection";
import AboutSection from "./components/home/AboutSection";
import HelpSection from "./components/home/HelpSection";
import MapGallery from "./components/home/MapGallery";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <MapGallery />
      <WhyPantauTularSection />
      <FeaturesSection />
      <AboutSection />
      <HelpSection />
      <Footer />
    </>
  );
}
