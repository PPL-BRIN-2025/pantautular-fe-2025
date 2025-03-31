import React from "react";
import Navbar from "../components/Navbar";
import FilterSection from "../components/dashboard/FilterSection";
import InformationSection from "../components/dashboard/InformationSection";

const Page = () => {
    return (
        <div className="h-screen bg-[#ebf3f5]">
            <Navbar />
            <div className="h-full flex w-full gap-5">
                <div className="w-2/5 bg-transparent">
                    <FilterSection />
                </div>
                <div className="w-3/5 bg-transparent">
                    <InformationSection />
                </div>
            </div>
        </div>
    );
};

export default Page;


