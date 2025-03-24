"use client";
import React, { useState } from "react";
import GeneralInformation from "./GeneralInformation";
import CasesOrder from "./CasesOrder";
import DashboardButton from "../floating_buttons/DashboardButton";
import {MapButton} from "../floating_buttons/MapButton";

const InformationSection = () => {
    const [activeSection, setActiveSection] = useState("section1");

    return (
        <div className="flex flex-col h-full bg-transparent text-white text-xl p-4 pt-8 pl-8">
            <div className="flex justify-between">
                <div className="flex gap-4 bg-white p-2 shadow-md rounded-t-lg w-8/12">
                    <button
                        className={`px-4 py-2 transition-colors border-b-4 ${
                            activeSection === "section1"
                                ? "border-blue-500 text-black"
                                : "border-transparent text-gray-500"
                        }`}
                        onClick={() => setActiveSection("section1")}
                    >
                        Informasi Umum
                    </button>
                    <button
                        className={`px-4 py-2 transition-colors border-b-4 ${
                            activeSection === "section2"
                                ? "border-blue-500 text-black"
                                : "border-transparent text-gray-500"
                        }`}
                        onClick={() => setActiveSection("section2")}
                    >
                        Urutan Kasus
                    </button>
                </div>
                <div className="fixed right-5 z-20 flex gap-2">
                    <DashboardButton />
                    <MapButton />
                </div>
            </div>

            {/* Dynamic Section */}
            <div className="flex-grow mt-4">
                {activeSection === "section1" ? <GeneralInformation /> : <CasesOrder />}
            </div>
        </div>
    );
};

export default InformationSection;
